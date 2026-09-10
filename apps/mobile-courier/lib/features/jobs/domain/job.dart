enum JobStatus {
  pending('PENDING', 'Pendiente'),
  offered('OFFERED', 'Ofertado'),
  accepted('ACCEPTED', 'Aceptado'),
  pickedUp('PICKED_UP', 'Recogido'),
  inTransit('IN_TRANSIT', 'En camino'),
  delivered('DELIVERED', 'Entregado'),
  cancelled('CANCELLED', 'Cancelado');

  const JobStatus(this.value, this.label);

  final String value;
  final String label;

  static JobStatus fromValue(Object? raw) => values.firstWhere(
        (status) => status.value == raw,
        orElse: () => JobStatus.pending,
      );

  bool get isActive => switch (this) {
        JobStatus.accepted || JobStatus.pickedUp || JobStatus.inTransit => true,
        _ => false,
      };

  bool get isFinished =>
      this == JobStatus.delivered || this == JobStatus.cancelled;
}

class Address {
  const Address({
    required this.line1,
    required this.city,
    required this.lat,
    required this.lng,
    this.line2,
    this.reference,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        line1: json['line1'] as String? ?? '',
        line2: json['line2'] as String?,
        city: json['city'] as String? ?? '',
        reference: json['reference'] as String?,
        lat: (json['lat'] as num?)?.toDouble() ?? 0,
        lng: (json['lng'] as num?)?.toDouble() ?? 0,
      );

  final String line1;
  final String? line2;
  final String city;
  final String? reference;
  final double lat;
  final double lng;

  String get short => city.isEmpty ? line1 : '$line1, $city';

  Map<String, dynamic> toJson() => {
        'line1': line1,
        'line2': line2,
        'city': city,
        'reference': reference,
        'lat': lat,
        'lng': lng,
      };
}

class Job {
  const Job({
    required this.id,
    required this.companyId,
    required this.status,
    required this.pickup,
    required this.dropoff,
    required this.price,
    required this.createdAt,
    this.courierId,
    this.distanceMeters,
    this.durationSeconds,
    this.notes,
    this.proofOfDeliveryUrl,
    this.acceptedAt,
    this.completedAt,
  });

  factory Job.fromJson(Map<String, dynamic> json) => Job(
        id: json['id'] as String,
        companyId: json['companyId'] as String? ?? '',
        courierId: json['courierId'] as String?,
        status: JobStatus.fromValue(json['status']),
        pickup: Address.fromJson(_map(json['pickup'])),
        dropoff: Address.fromJson(_map(json['dropoff'])),
        price: (json['price'] as num?)?.toDouble() ?? 0,
        distanceMeters: (json['distanceMeters'] as num?)?.toDouble(),
        durationSeconds: (json['durationSeconds'] as num?)?.toDouble(),
        notes: json['notes'] as String?,
        proofOfDeliveryUrl: json['proofOfDeliveryUrl'] as String?,
        createdAt: _date(json['createdAt']) ?? DateTime.now(),
        acceptedAt: _date(json['acceptedAt']),
        completedAt: _date(json['completedAt']),
      );

  final String id;
  final String companyId;
  final String? courierId;
  final JobStatus status;
  final Address pickup;
  final Address dropoff;
  final double price;
  final double? distanceMeters;
  final double? durationSeconds;
  final String? notes;
  final String? proofOfDeliveryUrl;
  final DateTime createdAt;
  final DateTime? acceptedAt;
  final DateTime? completedAt;

  double? get distanceKm =>
      distanceMeters == null ? null : distanceMeters! / 1000;

  int? get durationMinutes =>
      durationSeconds == null ? null : (durationSeconds! / 60).ceil();

  Job copyWith({
    JobStatus? status,
    String? courierId,
    String? proofOfDeliveryUrl,
    DateTime? acceptedAt,
    DateTime? completedAt,
  }) =>
      Job(
        id: id,
        companyId: companyId,
        courierId: courierId ?? this.courierId,
        status: status ?? this.status,
        pickup: pickup,
        dropoff: dropoff,
        price: price,
        distanceMeters: distanceMeters,
        durationSeconds: durationSeconds,
        notes: notes,
        proofOfDeliveryUrl: proofOfDeliveryUrl ?? this.proofOfDeliveryUrl,
        createdAt: createdAt,
        acceptedAt: acceptedAt ?? this.acceptedAt,
        completedAt: completedAt ?? this.completedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'companyId': companyId,
        'courierId': courierId,
        'status': status.value,
        'pickup': pickup.toJson(),
        'dropoff': dropoff.toJson(),
        'price': price,
        'distanceMeters': distanceMeters,
        'durationSeconds': durationSeconds,
        'notes': notes,
        'proofOfDeliveryUrl': proofOfDeliveryUrl,
        'createdAt': createdAt.toUtc().toIso8601String(),
        'acceptedAt': acceptedAt?.toUtc().toIso8601String(),
        'completedAt': completedAt?.toUtc().toIso8601String(),
      };

  static Map<String, dynamic> _map(Object? raw) =>
      raw is Map ? Map<String, dynamic>.from(raw) : const {};

  static DateTime? _date(Object? raw) =>
      raw is String ? DateTime.tryParse(raw) : null;
}
