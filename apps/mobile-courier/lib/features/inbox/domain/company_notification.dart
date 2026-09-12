class CompanyNotification {
  const CompanyNotification({
    required this.id,
    required this.icon,
    required this.title,
    required this.body,
    required this.when,
    required this.unread,
  });

  factory CompanyNotification.fromJson(Map<String, dynamic> json) => CompanyNotification(
        id: json['id'] as String? ?? '',
        icon: json['icon'] as String? ?? 'notifications',
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        when: DateTime.tryParse(json['when'] as String? ?? '') ?? DateTime.now(),
        unread: json['unread'] as bool? ?? false,
      );

  final String id;
  final String icon;
  final String title;
  final String body;
  final DateTime when;
  final bool unread;
}
