import 'package:dio/dio.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';
import 'widgets/auth_field.dart';

/// Registro (Figma: register). El rol llega desde /role (por defecto COURIER).
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key, this.role = 'COURIER'});

  final String role;

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure1 = true;
  bool _obscure2 = true;
  bool _terms = false;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: [
              const SizedBox(height: 40),
              Text('Crear cuenta',
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('Únete a la red logística de Vexa',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: VexaColors.gray500)),
              const SizedBox(height: 28),
              AuthField(
                label: 'Nombre completo',
                hint: 'Juan Pérez',
                icon: Icons.person_outline,
                controller: _name,
                validator: (v) =>
                    (v == null || v.trim().length < 2) ? 'Ingresa tu nombre' : null,
              ),
              const SizedBox(height: 18),
              AuthField(
                label: 'Correo electrónico',
                hint: '',
                icon: Icons.mail_outline,
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || !v.contains('@'))
                    ? 'Ingresa un correo válido'
                    : null,
              ),
              const SizedBox(height: 18),
              AuthField(
                label: 'Teléfono',
                hint: '+57 300 000 0000',
                icon: Icons.phone_outlined,
                controller: _phone,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 18),
              AuthField(
                label: 'Contraseña',
                hint: 'Crea una contraseña segura',
                icon: Icons.lock_outline,
                controller: _password,
                obscureText: _obscure1,
                validator: (v) =>
                    (v == null || v.length < 8) ? 'Mínimo 8 caracteres' : null,
                trailing: IconButton(
                  icon: Icon(_obscure1
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscure1 = !_obscure1),
                ),
              ),
              const SizedBox(height: 18),
              AuthField(
                label: 'Confirmar contraseña',
                hint: 'Repite tu contraseña',
                icon: Icons.lock_outline,
                controller: _confirm,
                obscureText: _obscure2,
                validator: (v) =>
                    v != _password.text ? 'Las contraseñas no coinciden' : null,
                trailing: IconButton(
                  icon: Icon(_obscure2
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined),
                  onPressed: () => setState(() => _obscure2 = !_obscure2),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 24, height: 24,
                    child: Checkbox(
                      value: _terms,
                      onChanged: (v) => setState(() => _terms = v ?? false),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        text: 'Acepto los ',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: VexaColors.gray600),
                        children: [
                          TextSpan(
                            text: 'Términos de servicio',
                            style: const TextStyle(
                                color: VexaColors.primary600,
                                fontWeight: FontWeight.w600),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => context.push(AppRoutes.terms),
                          ),
                          const TextSpan(text: ' y la '),
                          TextSpan(
                            text: 'Política de privacidad',
                            style: const TextStyle(
                                color: VexaColors.primary600,
                                fontWeight: FontWeight.w600),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => context.push(AppRoutes.privacy),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _loading || !_terms ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Crear cuenta'),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('¿Ya tienes una cuenta?',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: VexaColors.gray500)),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.login),
                    child: const Text('Iniciar sesión'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authStateProvider.notifier).register(
            fullName: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            role: widget.role,
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          );
      if (!mounted) return;
      await context.push(AppRoutes.verifyEmail, extra: _email.text.trim());
    } on DioException catch (e) {
      if (!mounted) return;
      final conflict = e.response?.statusCode == 409;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(conflict
              ? 'Ya existe una cuenta con ese correo'
              : 'No se pudo crear la cuenta'),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
