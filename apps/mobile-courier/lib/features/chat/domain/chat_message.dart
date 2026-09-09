class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.body,
    required this.sentAt,
    required this.isMine,
  });

  final String id;
  final String body;
  final DateTime sentAt;
  final bool isMine;
}
