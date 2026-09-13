class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.icon,
    required this.title,
    required this.body,
    required this.when,
    required this.unread,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) => NotificationItem(
        id: json['id'] as String? ?? '',
        icon: json['icon'] as String? ?? 'notifications',
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        when: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
        unread: !(json['isRead'] as bool? ?? false),
      );

  final String id;
  final String icon;
  final String title;
  final String body;
  final DateTime when;
  final bool unread;
}
