class CompanyProfile {
  const CompanyProfile({required this.id, required this.name, required this.taxId});

  factory CompanyProfile.fromJson(Map<String, dynamic> json) => CompanyProfile(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        taxId: json['taxId'] as String? ?? '',
      );

  final String id;
  final String name;
  final String taxId;
}

class CompanySettings {
  const CompanySettings({
    required this.name,
    required this.taxId,
    this.adminEmail,
    this.twoFactor = false,
    this.language = 'es',
    this.currency = 'COP',
    this.timezone = 'America/Bogota',
    this.address,
  });

  factory CompanySettings.fromJson(Map<String, dynamic> json) => CompanySettings(
        name: json['name'] as String? ?? '',
        taxId: json['taxId'] as String? ?? '',
        adminEmail: json['adminEmail'] as String?,
        twoFactor: json['twoFactor'] as bool? ?? false,
        language: json['language'] as String? ?? 'es',
        currency: json['currency'] as String? ?? 'COP',
        timezone: json['timezone'] as String? ?? 'America/Bogota',
        address: json['address'] as String?,
      );

  final String name;
  final String taxId;
  final String? adminEmail;
  final bool twoFactor;
  final String language;
  final String currency;
  final String timezone;
  final String? address;
}
