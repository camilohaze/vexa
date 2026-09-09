import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/env.dart';
import '../constants/socket_events.dart';

typedef JsonMap = Map<String, dynamic>;

class RealtimeClient {
  RealtimeClient({required String baseUrl}) : _baseUrl = baseUrl;

  final String _baseUrl;
  final Map<String, StreamController<JsonMap>> _controllers = {};
  final StreamController<bool> _connection = StreamController.broadcast();
  io.Socket? _socket;

  bool get isConnected => _socket?.connected ?? false;

  Stream<bool> get connectionChanges => _connection.stream;

  Stream<JsonMap> get newJobs => on(SocketEvents.newJob);
  Stream<JsonMap> get jobAccepted => on(SocketEvents.jobAccepted);
  Stream<JsonMap> get jobCancelled => on(SocketEvents.jobCancelled);
  Stream<JsonMap> get jobCompleted => on(SocketEvents.jobCompleted);
  Stream<JsonMap> get courierLocations => on(SocketEvents.courierLocation);
  Stream<JsonMap> get jobMessages => on(SocketEvents.jobMessage);

  void connect(String token) {
    disconnect();
    final socket = io.io(
      '$_baseUrl/realtime',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableReconnection()
          .setAuth({'token': token})
          .build(),
    );

    socket.onConnect((_) => _connection.add(true));
    socket.onDisconnect((_) => _connection.add(false));
    socket.onConnectError(
      (error) => debugPrint('Realtime: connect error $error'),
    );

    for (final event in SocketEvents.all) {
      socket.on(event, (data) => _controllers[event]?.add(_asMap(data)));
    }

    socket.connect();
    _socket = socket;
  }

  void disconnect() {
    final socket = _socket;
    if (socket == null) return;
    socket.dispose();
    _socket = null;
    _connection.add(false);
  }

  Stream<JsonMap> on(String event) {
    final controller =
        _controllers.putIfAbsent(event, StreamController<JsonMap>.broadcast);
    return controller.stream;
  }

  void emit(String event, JsonMap payload) {
    final socket = _socket;
    if (socket == null || !socket.connected) {
      debugPrint('Realtime: dropped $event, socket not connected');
      return;
    }
    socket.emit(event, payload);
  }

  void emitCourierLocation(JsonMap payload) =>
      emit(SocketEvents.courierLocation, payload);

  void dispose() {
    disconnect();
    for (final controller in _controllers.values) {
      controller.close();
    }
    _controllers.clear();
    _connection.close();
  }

  static JsonMap _asMap(dynamic data) {
    if (data is JsonMap) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    if (data is List && data.isNotEmpty) return _asMap(data.first);
    return const {};
  }
}

final realtimeClientProvider = Provider<RealtimeClient>((ref) {
  final client = RealtimeClient(baseUrl: Env.realtimeUrl);
  ref.onDispose(client.dispose);
  return client;
});
