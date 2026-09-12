import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/vexa_colors.dart';
import '../domain/chat_message.dart';
import '../providers.dart';

/// Chat 1:1 con la empresa asignada al pedido (REST + socket JOB_MESSAGE).
class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key, required this.jobId, this.peerName, this.subtitle});

  final String jobId;
  final String? peerName;

  /// Texto bajo el nombre del contacto. Si es nulo, se arma a partir del
  /// [jobId] como referencia de pedido ("Entrega #XXXXXX").
  final String? subtitle;

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(chatMessagesProvider(widget.jobId));
    final messages = messagesAsync.valueOrNull ?? const <ChatMessage>[];
    final typing = ref.watch(chatTypingProvider(widget.jobId));
    final peer = widget.peerName ?? 'Empresa';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: const BackButton(),
        titleSpacing: 0,
        title: Row(
          children: [
            const CircleAvatar(
              radius: 20,
              backgroundColor: VexaColors.primary100,
              child: Icon(Icons.business, color: VexaColors.primary700, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(peer, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(
                    widget.subtitle ??
                        'Entrega #${widget.jobId.substring(0, widget.jobId.length.clamp(0, 6)).toUpperCase()}',
                    style: const TextStyle(fontSize: 12, color: VexaColors.gray500),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.phone_outlined), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              children: [
                const _DayDivider(label: 'HOY'),
                const SizedBox(height: 16),
                for (final m in messages) _Bubble(message: m),
                if (typing) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const SizedBox(width: 8),
                      Text('$peer está escribiendo…',
                          style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
                    ],
                  ),
                ],
              ],
            ),
          ),
          _InputBar(
            controller: _input,
            onSend: () {
              final text = _input.text.trim();
              if (text.isEmpty) return;
              ref.read(chatMessagesProvider(widget.jobId).notifier).send(text);
              _input.clear();
              _scrollToEnd();
            },
          ),
        ],
      ),
    );
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }
}

class _DayDivider extends StatelessWidget {
  const _DayDivider({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11, fontWeight: FontWeight.w600,
          letterSpacing: 0.6, color: VexaColors.gray400,
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});
  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('h:mm a').format(message.sentAt.toLocal());
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment:
            message.isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            constraints: const BoxConstraints(maxWidth: 280),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: message.isMine ? VexaColors.primary600 : VexaColors.gray100,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              message.body,
              style: TextStyle(
                fontSize: 14, height: 1.4,
                color: message.isMine ? Colors.white : VexaColors.gray800,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(time, style: const TextStyle(fontSize: 11, color: VexaColors.gray400)),
        ],
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  const _InputBar({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: VexaColors.gray200)),
        ),
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: VexaColors.gray500),
              onPressed: () {},
            ),
            Expanded(
              child: TextField(
                controller: controller,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: InputDecoration(
                  hintText: 'Escribe tu mensaje…',
                  isDense: true,
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.emoji_emotions_outlined, size: 20),
                    color: VexaColors.gray400,
                    onPressed: () {},
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: VexaColors.primary600,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onSend,
                child: const Padding(
                  padding: EdgeInsets.all(9),
                  child: Icon(Icons.send, size: 18, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
