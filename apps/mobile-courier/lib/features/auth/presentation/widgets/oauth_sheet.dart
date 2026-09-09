import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/auth_state.dart';
import '../../providers.dart';

/// Abre el flujo OAuth del proveedor. Muestra la URL del backend y pide
/// los tokens resultantes (hasta implementar deep links nativos).
/// Devuelve `(access, refresh)` o `null` si se cancela.
Future<({String access, String refresh})?> showVexaOAuthSheet(
  BuildContext context,
  WidgetRef ref,
  AuthProvider provider,
) {
  final uri = ref.read(authStateProvider.notifier).loginUri(provider);
  return showModalBottomSheet<({String access, String refresh})>(
    context: context,
    isScrollControlled: true,
    builder: (context) => _TokenSheet(provider: provider, uri: uri),
  );
}

class _TokenSheet extends StatefulWidget {
  const _TokenSheet({required this.provider, required this.uri});

  final AuthProvider provider;
  final Uri uri;

  @override
  State<_TokenSheet> createState() => _TokenSheetState();
}

class _TokenSheetState extends State<_TokenSheet> {
  final _access = TextEditingController();
  final _refresh = TextEditingController();

  @override
  void dispose() {
    _access.dispose();
    _refresh.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24, 24, 24, 24 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Iniciar sesión con ${widget.provider.label}',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Abre esta URL en el navegador y pega los tokens devueltos.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          SelectableText(
            widget.uri.toString(),
            style: theme.textTheme.bodySmall
                ?.copyWith(color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _access,
            decoration: const InputDecoration(labelText: 'Access token'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _refresh,
            decoration: const InputDecoration(labelText: 'Refresh token'),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              final access = _access.text.trim();
              if (access.isEmpty) return;
              Navigator.of(context).pop(
                (access: access, refresh: _refresh.text.trim()),
              );
            },
            child: const Text('Entrar'),
          ),
        ],
      ),
    );
  }
}
