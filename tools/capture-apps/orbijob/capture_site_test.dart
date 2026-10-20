// Temporary generator for the lucksrei case-study page (pt-BR, en, es; light theme; 2x). CAPTURE=1 CAPTURE_OUT=<dir> flutter test test/tool/capture_site_test.dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbijob/app.dart';
import 'package:orbijob/core/orbi/orbi.dart';
import 'package:orbijob/features/applications/domain/application_record.dart';
import 'package:orbijob/features/auth/domain/auth_user.dart';
import 'package:orbijob/features/compare/compare_cubit.dart';
import 'package:orbijob/features/notifications/domain/notifications_repository.dart';
import 'package:orbijob/features/preferences/domain/user_preferences.dart';
import 'package:orbijob/features/profile/domain/professional_profile.dart';
import 'package:orbijob/features/search/domain/entities/job_posting.dart';
import 'package:orbijob/features/search/domain/job_area.dart';
import 'package:orbijob/features/search/domain/job_filters.dart';
import 'package:orbijob/features/searches/domain/saved_search.dart';
import 'package:orbijob/features/searches/domain/search_spec.dart';
import 'package:orbijob/l10n/app_localizations.dart';
import 'package:orbijob/preview/preview_fixtures.dart';

import '../helpers/fakes.dart';
import '../helpers/harness.dart';

const _user = AuthUser(id: 'user-a', email: 'maria@example.com');
final _capture = Platform.environment['CAPTURE'] == '1';
final _out = Directory(Platform.environment['CAPTURE_OUT'] ?? '/tmp/orbi_shots');

class _WritingComparator extends GoldenFileComparator {
  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async => true;
  @override
  Future<void> update(Uri golden, Uint8List imageBytes) async {
    final f = File('${_out.path}/${golden.pathSegments.last}');
    await f.create(recursive: true);
    await f.writeAsBytes(imageBytes);
  }
}

Future<void> _loadIcons() async {
  final root = Platform.environment['FLUTTER_ROOT'];
  final f = File('$root/bin/cache/artifacts/material_fonts/materialicons-regular.otf');
  final loader = FontLoader('MaterialIcons')..addFont(Future.value(ByteData.sublistView(f.readAsBytesSync())));
  await loader.load();
}

Future<void> _shot(WidgetTester t, String name) async {
  await t.pumpAndSettle();
  await expectLater(find.byType(OrbiJobApp), matchesGoldenFile('$name.png'));
}

Future<void> _tapText(WidgetTester t, String label) async {
  await t.tap(find.text(label).first);
  await t.pumpAndSettle();
}

AppLocalizations _l(WidgetTester t) => AppLocalizations.of(t.element(find.byType(Scaffold).first));

/// Fictional data (a made-up person, example.com addresses), in the language of the screen.
Future<Fakes> _seed(FakeAuth auth, String code) async {
  final s = switch (code) {
    'pt' => (
        headline: 'Fisioterapeuta',
        summary: 'Saúde da mulher e reabilitação do assoalho pélvico.',
        skills: ['Fisioterapia pélvica', 'Flutter', 'Cuidado ao paciente'],
        s1: 'Fisioterapia pélvica na Alemanha',
        s2: 'Flutter remoto',
        s3: 'Enfermagem em Portugal',
        note: 'Perguntar sobre a escala de plantão.',
      ),
    'es' => (
        headline: 'Fisioterapeuta',
        summary: 'Salud de la mujer y rehabilitación del suelo pélvico.',
        skills: ['Fisioterapia pélvica', 'Flutter', 'Atención al paciente'],
        s1: 'Fisioterapia pélvica en Alemania',
        s2: 'Flutter remoto',
        s3: 'Enfermería en Portugal',
        note: 'Preguntar por el turno de guardias.',
      ),
    _ => (
        headline: 'Physiotherapist',
        summary: 'Women’s health and pelvic floor rehabilitation.',
        skills: ['Pelvic physiotherapy', 'Flutter', 'Patient care'],
        s1: 'Pelvic physio in Germany',
        s2: 'Remote Flutter',
        s3: 'Nursing in Portugal',
        note: 'Ask about the on-call rota.',
      ),
  };
  final fakes = Fakes(auth: auth);
  final p = await fakes.profiles.save(
    ProfessionalProfile(
      name: 'Maria Souza',
      countryOfResidence: 'BR',
      skills: s.skills,
      languages: const [ProfileLanguage(code: 'pt', level: 'native'), ProfileLanguage(code: 'en', level: 'fluent')],
      personal: {'headline': s.headline, 'summary': s.summary, 'city': 'São Paulo'},
      preferences: const {'workMode': 'hybrid'},
    ),
  );
  final r = await fakes.resumes.upload(p.id!, tinyPdf());
  await fakes.profiles.save(p.copyWith(primaryResumeId: r.id));
  await fakes.resumes.upload(p.id!, tinyPdf(3));
  fakes.preferences.stored = const UserPreferences(countriesOfInterest: ['DE', 'PT']);
  fakes.savedSearches.rows.addAll([
    SavedSearch(
      id: 's1', name: s.s1, alertsEnabled: true, frequency: AlertFrequency.daily,
      query: const SearchSpec(term: 'physiotherapist', filters: JobFilters(countryCode: 'DE', area: JobArea.health, workModes: {WorkMode.hybrid, WorkMode.remote})).toQuery(),
    ),
    SavedSearch(
      id: 's2', name: s.s2, alertsEnabled: true, frequency: AlertFrequency.instant,
      query: const SearchSpec(term: 'flutter', filters: JobFilters(workModes: {WorkMode.remote})).toQuery(),
    ),
    SavedSearch(id: 's3', name: s.s3, query: const SearchSpec(term: 'nurse', filters: JobFilters(countryCode: 'PT')).toQuery()),
  ]);
  final now = DateTime.now().toUtc();
  fakes.notifications.rows.addAll([
    AppNotification(id: 'r1', title: 'Pelvic Health Physiotherapist', company: 'Example Health Clinic', kind: NotificationKind.interview, applicationId: 'a1', createdAt: now.subtract(const Duration(minutes: 40))),
    AppNotification(id: 'n1', title: 'Beckenboden-Physiotherapeut:in (m/w/d)', company: 'Beispiel Klinik GmbH', country: 'DE', searchIds: const ['s1'], createdAt: now.subtract(const Duration(hours: 2))),
    AppNotification(id: 'n2', title: 'Senior Flutter Developer', company: 'Example Tech Ltd', searchIds: const ['s2'], createdAt: now.subtract(const Duration(hours: 9))),
    AppNotification(id: 'n3', title: 'Physiotherapist — women’s health', company: 'Klinikum Nord', country: 'DE', searchIds: const ['s1'], createdAt: now.subtract(const Duration(days: 2)), readAt: now.subtract(const Duration(days: 1))),
  ]);
  JobPosting job(String id, String co, String ti) => JobPosting(source: 'manual', externalId: id, company: co, title: ti, originalUrl: id == 'a1' ? 'https://example.com/a1' : '');
  fakes.applications.rows.addAll([
    ApplicationRecord(id: 'a1', stage: ApplicationStage.interview, appliedAt: now.subtract(const Duration(days: 9)), interviewAt: DateTime.now().add(const Duration(days: 2, hours: 3)), note: s.note, job: job('a1', 'Klinikum Nord', 'Physiotherapist — women’s health')),
    ApplicationRecord(id: 'a2', stage: ApplicationStage.applied, appliedAt: now.subtract(const Duration(days: 12)), followUpAt: DateTime.now().subtract(const Duration(days: 1)), job: job('a2', 'Hospital Santa Luzia', 'Pelvic floor physiotherapist')),
    ApplicationRecord(id: 'a3', stage: ApplicationStage.interested, job: job('a3', 'Clínica Aurora', 'Physiotherapist')),
    ApplicationRecord(id: 'a4', stage: ApplicationStage.offer, appliedAt: now.subtract(const Duration(days: 30)), job: job('a4', 'Reha Zentrum', 'Physiotherapeutin')),
    ApplicationRecord(id: 'a5', stage: ApplicationStage.rejected, appliedAt: now.subtract(const Duration(days: 40)), job: job('a5', 'Med Group', 'Clinic coordinator')),
  ]);
  return fakes;
}

void main() {
  setUpAll(() async {
    if (!_capture) return;
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadBrandFonts();
    await _loadIcons();
    goldenFileComparator = _WritingComparator();
    autoUpdateGoldenFiles = true;
  });

  const phone = Size(390, 844);
  for (final code in const ['pt', 'en', 'es']) {
    void scene(String slot, Future<void> Function(WidgetTester t, AppLocalizations l) body, {bool signedIn = true, bool resumePdf = false}) {
      testWidgets('$slot-$code', (t) async {
        final auth = FakeAuth();
        if (signedIn) auth.currentUser = _user;
        final fakes = await _seed(auth, code);
        if (resumePdf) {
          for (final r in fakes.resumes.rows) {
            fakes.resumes.contents[r.id] = File('test/fixtures/resumes/cv_$code.pdf').readAsBytesSync();
          }
        }
        await pumpApp(t, size: phone, devicePixelRatio: 2, platformBrightness: Brightness.light, repo: PreviewSearchRepository(), auth: auth, fakes: fakes, locale: Locale(code));
        await body(t, _l(t));
        await _shot(t, '$slot-$code');
      }, skip: !_capture);
    }

    Future<void> openLogin(WidgetTester t, AppLocalizations l) async {
      await t.tap(find.byTooltip(l.profile));
      await t.pumpAndSettle();
    }

    scene('login', (t, l) async {
      await openLogin(t, l);
      await t.tap(find.descendant(of: find.byType(OrbiPrimaryButton), matching: find.text(l.accountSignIn)));
    }, signedIn: false);
    scene('signup', (t, l) async {
      await openLogin(t, l);
      await t.tap(find.text(l.gateCreateAccount).last);
    }, signedIn: false);
    scene('home', (t, l) async {});
    scene('explore', (t, l) async => _tapText(t, l.navExplore));
    scene('filters', (t, l) async {
      await _tapText(t, l.navExplore);
      await t.tap(find.byTooltip(l.filtersButton));
    });
    scene('job-detail', (t, l) async {
      await _tapText(t, l.navExplore);
      await t.tap(find.text('Example Tech Ltd').first);
    });
    scene('application-kit', (t, l) async {
      await _tapText(t, l.navExplore);
      await t.tap(find.text('Example Tech Ltd').first);
      await t.pumpAndSettle();
      await t.tap(find.text(l.kitButton));
    });
    scene('job-menu', (t, l) async {
      await _tapText(t, l.navExplore);
      await t.tap(find.byIcon(Icons.more_vert_rounded).first);
    });
    scene('no-results', (t, l) async {
      await _tapText(t, l.navExplore);
      await t.enterText(find.byType(TextField).last, 'fisioterapia pélvica xyz');
      await t.testTextInput.receiveAction(TextInputAction.search);
    });
    scene('recommendations', (t, l) async {
      await t.drag(find.byType(Scrollable).first, const Offset(0, -420));
    });
    scene('why', (t, l) async {
      final why = find.byIcon(Icons.help_outline_rounded);
      await t.ensureVisible(why.first);
      await t.pumpAndSettle();
      await t.tap(why.first);
    });
    scene('save-search', (t, l) async {
      await _tapText(t, l.navExplore);
      await t.enterText(find.byType(TextField).last, 'physiotherapist');
      await t.testTextInput.receiveAction(TextInputAction.search);
      await t.pumpAndSettle();
      await t.tap(find.byIcon(Icons.bookmark_add_outlined).first);
      await t.pumpAndSettle();
      await t.tap(find.byType(Switch).first);
    });
    scene('saved-searches', (t, l) async => t.tap(find.text(l.homeSavedAll).first));
    scene('notifications', (t, l) async => t.tap(find.byIcon(Icons.notifications_rounded)));
    scene('applications', (t, l) async => t.tap(find.text(l.navApplications).first));
    scene('application-detail', (t, l) async {
      await t.tap(find.text(l.navApplications).first);
      await t.pumpAndSettle();
      await t.tap(find.textContaining('Physiotherapist —').first);
    });
    scene('compare', (t, l) async {
      await _tapText(t, l.navExplore);
      final cubit = t.element(find.byType(Scaffold).first).read<CompareCubit>();
      final jobs = (await PreviewSearchRepository().search('')).jobs.map((x) => x.job).take(3);
      for (final j in jobs) {
        cubit.toggle(j);
      }
      await t.pumpAndSettle();
      await t.tap(find.text(l.cpCompare).last);
    });
    scene('profile-hub', (t, l) async => t.tap(find.byTooltip(l.profile)));
    scene('professional-profile', (t, l) async {
      await t.tap(find.byTooltip(l.profile));
      await t.pumpAndSettle();
      await _tapText(t, l.profileSectionProfessional);
    });
    scene('resumes', (t, l) async {
      await t.tap(find.byTooltip(l.profile));
      await t.pumpAndSettle();
      await _tapText(t, l.resumesSection);
    });
    scene('resume-review', (t, l) async {
      await t.tap(find.byTooltip(l.profile));
      await t.pumpAndSettle();
      await _tapText(t, l.resumesSection);
      await t.tap(find.byTooltip(l.resumeMoreActions).first);
      await t.pumpAndSettle();
      await t.tap(find.text(l.resumeSuggestAction));
      await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 800)));
    }, resumePdf: true);
    scene('settings', (t, l) async {
      await t.tap(find.byTooltip(l.profile));
      await t.pumpAndSettle();
      await _tapText(t, l.settingsTitle);
    });
    scene('language', (t, l) async {
      await t.tap(find.byTooltip(l.profile));
      await t.pumpAndSettle();
      await _tapText(t, l.settingsTitle);
      await _tapText(t, l.languageSystem);
    });
  }
}
