import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../network/api_client.dart';

/// Carpetas permitidas por `GET /storage/presign`.
enum StorageFolder { proofs, documents, invoices, avatars }

class UploadedFile {
  const UploadedFile({required this.key, this.publicUrl});
  final String key;
  final String? publicUrl;
}

/// Sube archivos a Cloudflare R2 mediante URL prefirmada:
/// 1. `GET /storage/presign` → uploadUrl
/// 2. `PUT uploadUrl` con los bytes (sin auth, la firma autoriza)
class FileUploadRepository {
  FileUploadRepository({required ApiClient api}) : _api = api;

  final ApiClient _api;
  final ImagePicker _picker = ImagePicker();

  Future<XFile?> pickImage({ImageSource source = ImageSource.camera}) =>
      _picker.pickImage(source: source, imageQuality: 85, maxWidth: 1600);

  Future<UploadedFile> upload(
    XFile file, {
    StorageFolder folder = StorageFolder.proofs,
  }) async {
    final bytes = await file.readAsBytes();
    final contentType = _contentType(file.name);

    final presign = await _api.dio.get<Map<String, dynamic>>(
      '/storage/presign',
      queryParameters: {'folder': folder.name, 'contentType': contentType},
    );
    final data = presign.data ?? const {};
    final uploadUrl = data['uploadUrl'] as String?;
    if (uploadUrl == null) throw StateError('Presign sin uploadUrl');

    // PUT directo a R2 (Dio limpio: sin baseUrl ni Authorization).
    await Dio().put<void>(
      uploadUrl,
      data: Stream.fromIterable([bytes]),
      options: Options(
        headers: {'Content-Type': contentType, 'Content-Length': bytes.length},
      ),
    );
    return UploadedFile(
      key: data['key'] as String,
      publicUrl: data['publicUrl'] as String?,
    );
  }

  /// Flujo completo: captura → sube → devuelve la URL a guardar en el pedido.
  Future<String?> captureAndUpload({
    ImageSource source = ImageSource.camera,
    StorageFolder folder = StorageFolder.proofs,
  }) async {
    final file = await pickImage(source: source);
    if (file == null) return null;
    final uploaded = await upload(file, folder: folder);
    return uploaded.publicUrl ?? uploaded.key;
  }

  String _contentType(String name) {
    final ext = name.split('.').last.toLowerCase();
    return switch (ext) {
      'png' => 'image/png',
      'webp' => 'image/webp',
      'heic' => 'image/heic',
      'pdf' => 'application/pdf',
      _ => 'image/jpeg',
    };
  }
}

final fileUploadRepositoryProvider = Provider<FileUploadRepository>(
  (ref) => FileUploadRepository(api: ref.watch(apiClientProvider)),
);
