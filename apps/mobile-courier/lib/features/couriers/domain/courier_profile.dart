class CourierProfile {
  const CourierProfile({
    required this.name,
    required this.rating,
    required this.totalJobs,
    required this.onTimeRate,
    required this.acceptanceRate,
    required this.vehicle,
    this.avatarUrl,
    this.vehicleDetails,
  });

  factory CourierProfile.fromJson(Map<String, dynamic> json) => CourierProfile(
        name: json['name'] as String? ?? 'Repartidor',
        avatarUrl: json['avatarUrl'] as String?,
        vehicle: json['vehicle'] as String? ?? '',
        vehicleDetails: _formatVehicleDetails(json['vehicleDetails']),
        rating: (json['rating'] as num?)?.toDouble() ?? 0,
        totalJobs: (json['totalJobs'] as num?)?.toInt() ?? 0,
        onTimeRate: (json['onTimeRate'] as num?)?.toDouble() ?? 0,
        acceptanceRate: (json['acceptanceRate'] as num?)?.toDouble() ?? 0,
      );

  static String? _formatVehicleDetails(Object? raw) {
    if (raw is! Map) return null;
    final make = raw['make'] as String?;
    final plate = raw['plate'] as String?;
    if (make == null && plate == null) return null;
    if (make != null && plate != null) return '$make ($plate)';
    return make ?? plate;
  }

  final String name;
  final String? avatarUrl;
  final String vehicle;
  final String? vehicleDetails;
  final double rating;
  final int totalJobs;
  final double onTimeRate;
  final double acceptanceRate;
}

class CourierReview {
  const CourierReview({
    required this.id,
    required this.author,
    required this.when,
    required this.stars,
    required this.text,
  });

  factory CourierReview.fromJson(Map<String, dynamic> json) => CourierReview(
        id: json['id'] as String? ?? '',
        author: json['author'] as String? ?? '',
        when: DateTime.tryParse(json['when'] as String? ?? '') ?? DateTime.now(),
        stars: (json['stars'] as num?)?.toInt() ?? 0,
        text: json['text'] as String? ?? '',
      );

  final String id;
  final String author;
  final DateTime when;
  final int stars;
  final String text;
}
