import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/storage/secure_storage.dart';
import '../jobs/data/jobs_repository.dart';
import 'domain/chat_message.dart';

/// Extrae `sub` del JWT de acceso sin librerías extra.
Future<String?> _currentUserId(Ref ref) async {
  final token = await ref.read(secureStorageProvider).readAccessToken();
  final parts = token?.split('.');
  if (parts == null || parts.length != 3) return null;
  try {
    final payload = jsonDecode(
      utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
    ) as Map;
    return payload['sub'] as String?;
  } catch (_) {
    return null;
  }
}

/// Chat persistente por pedido: historial REST + eventos socket
/// (`JOB_MESSAGE` retransmitido por el realtime-service vía Redis).
final chatMessagesProvider = AsyncNotifierProviderFamily<ChatMessagesNotifier,
    List<ChatMessage>, String>(ChatMessagesNotifier.new);

class ChatMessagesNotifier
    extends FamilyAsyncNotifier<List<ChatMessage>, String> {
  StreamSubscription? _sub;
  String? _myUserId;

  @override
  Future<List<ChatMessage>> build(String arg) async {
    final repo = ref.watch(jobsRepositoryProvider);
    _myUserId = await _currentUserId(ref);
    repo.subscribeJob(arg);
    _sub = repo.jobMessages
        .where((e) => e['jobId'] == arg)
        .listen((e) => _append(e));
    ref.onDispose(() => _sub?.cancel());

    final rows = await repo.fetchMessages(arg);
    return rows.map(_fromJson).toList();
  }

  Future<void> send(String body) async {
    if (body.trim().isEmpty) return;
    await ref.read(jobsRepositoryProvider).sendMessage(arg, body.trim());
  }

  void _append(Map<String, dynamic> e) {
    final message = _fromJson(e);
    final current = state.valueOrNull ?? const [];
    if (current.any((m) => m.id == message.id)) return;
    state = AsyncData([...current, message]);
  }

  ChatMessage _fromJson(Map<String, dynamic> e) {
    final senderId =
        e['senderId'] as String? ?? e['sender_id'] as String? ?? '';
    return ChatMessage(
      id: e['id'] as String? ??
          '${e['jobId'] ?? e['job_id'] ?? ''}-${e['sentAt'] ?? e['sent_at'] ?? ''}',
      body: e['body'] as String? ?? '',
      sentAt: DateTime.tryParse(
              e['sentAt'] as String? ?? e['sent_at'] as String? ?? '') ??
          DateTime.now(),
      isMine: senderId == _myUserId,
    );
  }
}

final chatTypingProvider =
    StateProvider.family<bool, String>((ref, jobId) => false);
