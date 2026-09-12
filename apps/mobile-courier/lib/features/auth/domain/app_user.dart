/// Usuario autenticado, común a cualquier rol (COURIER/COMPANY). Los campos
/// vienen tal cual del `/users/me` plano — el perfil específico de cada rol
/// (empresa o repartidor) se carga aparte, contra el `me` de su propio módulo.
class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.avatarUrl,
    this.courierId,
    this.rating,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final courier = json['courier'];
    return AppUser(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      role: json['role'] as String? ?? 'COURIER',
      avatarUrl: json['avatarUrl'] as String?,
      courierId: json['courierId'] as String? ??
          (courier is Map ? courier['id'] as String? : null),
      rating: courier is Map ? (courier['rating'] as num?)?.toDouble() : null,
    );
  }

  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? avatarUrl;
  final String? courierId;
  final double? rating;

  bool get isCompany => role == 'COMPANY';
  bool get isCourier => role == 'COURIER';

  String get trackingId => courierId ?? id;

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'fullName': fullName,
        'role': role,
        'avatarUrl': avatarUrl,
        'courierId': courierId,
      };
}
