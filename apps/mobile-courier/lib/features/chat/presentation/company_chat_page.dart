import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../deliveries/providers.dart';
import 'chat_page.dart';

/// Chat del envío visto por la empresa: el interlocutor es el repartidor
/// asignado, no la empresa (a diferencia de [ChatPage] usado por el courier).
class CompanyChatPage extends ConsumerWidget {
  const CompanyChatPage({super.key, required this.jobId});

  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final job = ref.watch(companyJobDetailProvider(jobId)).valueOrNull;
    return ChatPage(
      jobId: jobId,
      peerName: job?.courierName ?? 'Repartidor',
      peerIcon: Icons.person,
    );
  }
}
