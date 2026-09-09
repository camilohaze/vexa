import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';

class NotificationSettingsPage extends ConsumerWidget {
  const NotificationSettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(notificationPrefsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Notificaciones'),
        actions: [IconButton(icon: const Icon(Icons.more_horiz), onPressed: () {})],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Card(
            margin: EdgeInsets.zero,
            child: SwitchListTile(
              title: const Text('Permitir notificaciones push',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              subtitle: const Text('Activa o desactiva todas las notificaciones'),
              value: prefs.enabled,
              onChanged: (v) =>
                  ref.read(notificationPrefsProvider.notifier).setEnabled(v),
            ),
          ),
          const SizedBox(height: 28),
          Text('PREFERENCIAS', style: theme.textTheme.labelSmall?.copyWith(
            letterSpacing: 0.8, color: VexaColors.gray500, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          for (final cat in prefs.categories)
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(cat.title,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: Text(cat.subtitle,
                  style: const TextStyle(fontSize: 12, color: VexaColors.gray500)),
              value: cat.enabled && prefs.enabled,
              onChanged: prefs.enabled
                  ? (v) => ref
                      .read(notificationPrefsProvider.notifier)
                      .setCategory(cat.id, v)
                  : null,
            ),
          const SizedBox(height: 16),
          Card(
            margin: EdgeInsets.zero,
            child: SwitchListTile(
              title: const Text('Horario silencioso',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Silencia alertas push en el horario definido',
                  style: TextStyle(fontSize: 12, color: VexaColors.gray500)),
              value: prefs.quietHours && prefs.enabled,
              onChanged: prefs.enabled
                  ? (v) =>
                      ref.read(notificationPrefsProvider.notifier).setQuietHours(v)
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}
