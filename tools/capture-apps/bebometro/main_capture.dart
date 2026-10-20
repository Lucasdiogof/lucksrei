// TEMPORARY (not committed): local-only entry point that seeds fictional demo data, used to capture screens for the lucksrei case study.
import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/di/injector.dart';
import 'drinks/data/drink_repository.dart';
import 'drinks/domain/drink_category.dart';
import 'drinks/domain/drink_entry.dart';
import 'outings/data/outing_repository.dart';
import 'outings/domain/outing.dart';
import 'places/domain/place_draft.dart';
import 'tab/data/tab_repository.dart';
import 'tab/domain/tab_models.dart';
import 'table/domain/order_builder.dart';

const _me = Participant(id: 'p-me', name: 'Você', isMe: true);
const _joao = Participant(id: 'p-joao', name: 'João');
const _gle = Participant(id: 'p-gle', name: 'Gleidson');
const _rod = Participant(id: 'p-rod', name: 'Rodrigo');

Future<void> _seed(String lang, {bool idle = false}) async {
  final outings = getIt<OutingRepository>();
  final drinks = getIt<DrinkRepository>();
  final tabs = getIt<TabRepository>();
  final now = DateTime.now();
  final draft = switch (lang) { 'en' => 'Draft beer 400 ml', 'es' => 'Caña 400 ml', _ => 'Chopp 400 ml' };
  final lata = switch (lang) { 'en' => 'Canned beer 350 ml', 'es' => 'Cerveza en lata 350 ml', _ => 'Cerveja lata 350 ml' };
  final longneck = switch (lang) { 'en' => 'Long neck beer 600 ml', 'es' => 'Cerveza botella 600 ml', _ => 'Cerveja long neck 600 ml' };
  final caipi = switch (lang) { 'en' => 'Caipirinha', 'es' => 'Caipirinha', _ => 'Caipirinha' };
  var n = 0;
  String id() => 'seed-${n++}';
  final old = await outings.start(type: OutingType.barbecue, place: const PlaceSnapshot(nickname: 'Churrasco do Léo'), startedAt: now.subtract(const Duration(days: 9, hours: 6)));
  await drinks.saveAll(OrderBuilder.build(
    OrderInput(outingId: old.id, name: lata, category: DrinkCategory.beer, ownerId: _me.id, at: now.subtract(const Duration(days: 9, hours: 4)), units: {_me.id: 4}, priceKind: PriceKind.informed, priceCents: 700, containerMl: 350, abvPercent: 4.8),
    newId: id,
  ));
  await outings.finish(old.id, now.subtract(const Duration(days: 9, hours: 1)));
  if (idle) return;
  final o = await outings.start(type: OutingType.bar, place: const PlaceSnapshot(nickname: 'Bar do Zé', city: 'Goiânia', state: 'GO'), budgetCents: 25000, startedAt: now.subtract(const Duration(hours: 3)));
  await tabs.update(o.id, (d) => d.copyWith(participants: [_me, _joao, _gle, _rod], equalIds: [_me.id, _joao.id, _gle.id, _rod.id], mode: SplitMode.item, autoLink: true, serviceOn: true));
  Future<void> order(String name, DrinkCategory c, Map<String, int> units, int cents, int ml, double abv, Duration ago, {bool shared = false, Map<String, int?> portions = const {}}) async {
    await drinks.saveAll(OrderBuilder.build(
      OrderInput(outingId: o.id, name: name, category: c, ownerId: _me.id, at: now.subtract(ago), units: units, shared: shared, portions: portions, priceKind: PriceKind.informed, priceCents: cents, containerMl: ml, abvPercent: abv),
      newId: id,
    ));
  }
  await order(draft, DrinkCategory.draft, {_me.id: 2, _joao.id: 2, _gle.id: 1}, 1500, 400, 4.8, const Duration(hours: 2, minutes: 30));
  await order(caipi, DrinkCategory.cocktail, {_rod.id: 1, _me.id: 1}, 2200, 300, 14, const Duration(hours: 1, minutes: 40));
  await order(longneck, DrinkCategory.beer, {}, 2400, 600, 4.7, const Duration(hours: 1, minutes: 10), shared: true, portions: {_me.id: 200, _joao.id: 200, _gle.id: 200});
  await order(draft, DrinkCategory.draft, {_me.id: 1, _gle.id: 1, _rod.id: 1}, 1500, 400, 4.8, const Duration(minutes: 25));
  final fritas = switch (lang) { 'en' => 'French fries', 'es' => 'Papas fritas', _ => 'Porção de fritas' };
  final couvert = switch (lang) { 'en' => 'Live music cover', 'es' => 'Cubierto artístico', _ => 'Couvert artístico' };
  await tabs.update(o.id, (d) => d.copyWith(extras: [
    TabExtra(id: 'x1', description: fritas, category: ExtraCategory.food, createdAt: now, priceKind: PriceKind.informed, cents: 5500),
    TabExtra(id: 'x2', description: couvert, category: ExtraCategory.cover, createdAt: now, priceKind: PriceKind.informed, cents: 1200, quantity: 4, basis: PriceBasis.unit),
  ]));
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR');
  await initializeDateFormatting('en');
  await initializeDateFormatting('es');
  final lang = Uri.base.queryParameters['lang'] ?? 'pt';
  final prefs = await SharedPreferences.getInstance();
  final signedOut = Uri.base.queryParameters['out'] == '1';
  if (!signedOut) {
    await prefs.setString('auth.last_uid', 'demo-user');
    await prefs.setString('auth.last_email', 'maria@example.com');
  }
  await prefs.setString('app.language', lang);
  // Supabase can only be initialised once: doing it here makes the call inside configureDependencies fail, so the app runs local-only (no network, no sync).
  try {
    await Supabase.initialize(url: 'https://capture.invalid', publishableKey: 'capture');
  } catch (_) {}
  await configureDependencies();
  if (!signedOut) {
    await AccountScope.open('demo-user');
    if (getIt<OutingRepository>().count() == 0) await _seed(lang, idle: Uri.base.queryParameters['idle'] == '1');
  }
  runApp(const BebometroApp());
}
