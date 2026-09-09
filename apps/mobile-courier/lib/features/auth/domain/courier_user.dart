class CourierUser {
  const CourierUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.avatarUrl,
    this.courierId,
    this.rating,
  });

  factory CourierUser.fromJson(Map<String, dynamic> json) {
    final courier = json['courier'];
    return CourierUser(
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
