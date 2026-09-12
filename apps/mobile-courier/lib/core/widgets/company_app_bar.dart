import 'package:flutter/material.dart';

/// AppBar reutilizado en las pantallas de company: back + título + campana.
PreferredSizeWidget companyAppBar(
  BuildContext context,
  String title, {
  bool showBack = true,
  VoidCallback? onBell,
}) {
  return AppBar(
    leading: showBack
        ? IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => Navigator.of(context).canPop() ? Navigator.of(context).pop() : null,
          )
        : null,
    title: Text(title),
    centerTitle: false,
    actions: [
      IconButton(
        icon: const Icon(Icons.notifications_none),
        onPressed: onBell,
      ),
    ],
  );
}
