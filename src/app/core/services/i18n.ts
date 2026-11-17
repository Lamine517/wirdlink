import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Locale = 'fr' | 'en' | 'ar';
const STORAGE_KEY = 'wirdlink.language.v1';
/** French copy is the source key; content entered by users is never translated. */
const TRANSLATIONS: Readonly<Record<string, readonly [string, string]>> = {
  'Une mise à jour est prête.': ['An update is ready.', 'يتوفر تحديث جديد.'],
  'Cette version doit être actualisée.': [
    'This version needs to be refreshed.',
    'يجب تحديث هذا الإصدار.',
  ],
  'Actualisez pour utiliser la dernière version de WirdLink.': [
    'Refresh to use the latest version of WirdLink.',
    'حدّث الصفحة لاستخدام أحدث إصدار من WirdLink.',
  ],
  Actualiser: ['Refresh', 'تحديث'],
  'Actualiser l’application ?': ['Refresh the app?', 'هل تريد تحديث التطبيق؟'],
  'Le texte enregistré de votre brouillon est conservé. Après l’actualisation, vous devrez rattacher votre photo et votre audio.':
    [
      'Your saved draft text is kept. After refreshing, you will need to attach your photo and audio again.',
      'سيبقى نص مسودتك المحفوظ. بعد التحديث، ستحتاج إلى إرفاق الصورة والصوت من جديد.',
    ],
  'Garder cette page': ['Stay on this page', 'البقاء في هذه الصفحة'],
  'Actualiser quand même': ['Refresh anyway', 'التحديث على أي حال'],
  Publier: ['Publish', 'نشر'],
  'Continuer pour publier': ['Continue to publish', 'المتابعة للنشر'],
  '{count} lectures à partager': ['{count} readings to share', '{count} قراءة للمشاركة'],
  'Connectez-vous au moment de publier pour retrouver votre profil.': [
    'Sign in when publishing to access your profile.',
    'سجّل الدخول عند النشر للوصول إلى ملفك الشخصي.',
  ],
  'Il reste {available} sur {target}': [
    '{available} left out of {target}',
    'متبقي {available} من {target}',
  ],
  '{count} lectures en cours': ['{count} readings in progress', '{count} قراءة جارية'],
  'Ce wird est terminé. Merci !': ['This wird is complete. Thank you!', 'اكتمل هذا الورد. شكرًا!'],
  'Toutes les parts sont prises.': ['All shares have been reserved.', 'تم حجز جميع الحصص.'],
  'État des wirds': ['Wird status', 'حالة الأوراد'],
  Voir: ['Show', 'عرض'],
  Quand: ['When', 'متى'],
  'Qui peut voir': ['Who can view', 'من يمكنه الاطلاع'],
  'Chaque jour': ['Every day', 'كل يوم'],
  'Voir les wirds': ['View wirds', 'عرض الأوراد'],
  'Tout effacer': ['Clear all', 'مسح الكل'],
  'Installer WirdLink': ['Install WirdLink', 'تثبيت WirdLink'],
  'Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».': [
    'In Safari, tap Share, then “Add to Home Screen”.',
    'في Safari، اضغط على المشاركة ثم «إضافة إلى الشاشة الرئيسية».',
  ],
  'Dans le menu de votre navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».':
    [
      'In your browser menu, choose “Install app” or “Add to Home Screen”.',
      'في قائمة المتصفح، اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».',
    ],
  'WirdLink s’ouvrira ensuite comme une application.': [
    'WirdLink will then open like an app.',
    'سيفتح WirdLink بعد ذلك كتطبيق.',
  ],
  Compris: ['Got it', 'فهمت'],
  'Envoyer sur WhatsApp': ['Send on WhatsApp', 'إرسال عبر WhatsApp'],
  Autre: ['More', 'المزيد'],
  'Copier le lien': ['Copy link', 'نسخ الرابط'],
  'Lien à partager': ['Share link', 'رابط المشاركة'],
  'Ce lien est local. Ouvrez WirdLink depuis une adresse accessible pour le partager.': [
    'This link is local. Open WirdLink from an accessible address to share it.',
    'هذا رابط محلي. افتح WirdLink من عنوان متاح لمشاركته.',
  ],
  'Partage indisponible. Vous pouvez copier le lien.': [
    'Sharing unavailable. You can copy the link.',
    'المشاركة غير متاحة. يمكنك نسخ الرابط.',
  ],
  'Lien copié.': ['Link copied.', 'تم نسخ الرابط.'],
  'Copie indisponible. Sélectionnez le lien ci-dessous.': [
    'Copy unavailable. Select the link below.',
    'النسخ غير متاح. حدد الرابط أدناه.',
  ],
  'Partager ce wird': ['Share this wird', 'مشاركة هذا الورد'],
  '(facultatif)': ['(optional)', '(اختياري)'],
  facultatif: ['optional', 'اختياري'],
  'Accès privé': ['Private access', 'وصول خاص'],
  'Ajouter une photo': ['Add a photo', 'إضافة صورة'],
  'Annuler le dernier appui': ['Undo last tap', 'التراجع عن آخر ضغطة'],
  'Aucun résultat': ['No results', 'لا توجد نتائج'],
  'Aucune participation ici': ['No contributions here', 'لا توجد مشاركات هنا'],
  'Augmenter la quantité': ['Increase quantity', 'زيادة الكمية'],
  'Diminuer la quantité': ['Decrease quantity', 'تقليل الكمية'],
  'Autres moyens de connexion': ['Other sign-in methods', 'طرق أخرى لتسجيل الدخول'],
  'Avancement du wird': ['Wird progress', 'تقدم الورد'],
  'Ce compteur n’est pas disponible sur cet appareil.': [
    'This counter is unavailable on this device.',
    'هذا العداد غير متاح على هذا الجهاز.',
  ],
  'Ce navigateur ne propose pas la vibration. L’objectif est toujours signalé à l’écran.': [
    'This browser does not support vibration. Reaching your goal is still shown on screen.',
    'هذا المتصفح لا يدعم الاهتزاز. سيظهر بلوغ الهدف على الشاشة.',
  ],
  'Ce wird est indisponible. Retrouvez-le depuis son lien de partage.': [
    'This wird is unavailable. Open it using its shared link.',
    'هذا الورد غير متاح. افتحه من رابط المشاركة.',
  ],
  'Ce wird est privé': ['This wird is private', 'هذا الورد خاص'],
  'Ce wird et toutes ses participations seront supprimés. Cette action est définitive.': [
    'This wird and all its contributions will be permanently deleted.',
    'سيُحذف هذا الورد وجميع مشاركاته نهائيًا.',
  ],
  'Ce wird n’est pas disponible sur cet appareil.': [
    'This wird is unavailable on this device.',
    'هذا الورد غير متاح على هذا الجهاز.',
  ],
  'Cette part est terminée': ['This share is complete', 'اكتملت هذه الحصة'],
  'Changer d’adresse': ['Change email address', 'تغيير البريد الإلكتروني'],
  'Chargement du partage…': ['Loading sharing options…', 'جارٍ تحميل خيارات المشاركة…'],
  'Chargement du profil…': ['Loading profile…', 'جارٍ تحميل الملف الشخصي…'],
  'Choisir un modèle remplace le brouillon actuel.': [
    'Choosing a template replaces your current draft.',
    'اختيار نموذج يستبدل المسودة الحالية.',
  ],
  'Choisissez un début à partir d’aujourd’hui et une fin après le début, ou le même jour.': [
    'Choose a start date from today and an end date on or after it.',
    'اختر تاريخ بداية من اليوم وتاريخ نهاية في اليوم نفسه أو بعده.',
  ],
  'Choisissez un modèle, puis adaptez-le.': [
    'Choose a template, then customize it.',
    'اختر نموذجًا ثم عدّله.',
  ],
  'Choisissez un nombre entier supérieur à zéro.': [
    'Choose a whole number greater than zero.',
    'اختر عددًا صحيحًا أكبر من الصفر.',
  ],
  'Choisissez un wird et touchez « Je participe ».': [
    'Choose a wird and tap “Join in”.',
    'اختر وردًا واضغط على «أشارك».',
  ],
  'Code d’accès à 4 chiffres': ['4-digit access code', 'رمز دخول من 4 أرقام'],
  'Combien en tout ?': ['How many in total?', 'كم العدد الإجمالي؟'],
  'Compter ma part': ['Count my share', 'عدّ حصتي'],
  'Compteur indisponible': ['Counter unavailable', 'العداد غير متاح'],
  'Connectez-vous avec Google au moment de publier pour retrouver votre profil.': [
    'Sign in with Google when publishing to access your profile.',
    'سجّل الدخول باستخدام Google عند النشر للوصول إلى ملفك الشخصي.',
  ],
  'Connectez-vous pour publier votre wird.': [
    'Sign in to publish your wird.',
    'سجّل الدخول لنشر وردك.',
  ],
  'Ce compte existe déjà. Vos parts prises sans compte restent sur cet appareil.': [
    'This account already exists. Shares taken without an account stay on this device.',
    'هذا الحساب موجود بالفعل. الحصص المأخوذة دون حساب تبقى على هذا الجهاز.',
  ],
  'L’objectif reste le même jusqu’à la fin du wird.': [
    'The goal stays the same until the wird ends.',
    'يبقى الهدف كما هو حتى نهاية الورد.',
  ],
  'L’objectif recommence chaque jour.': [
    'The goal restarts every day.',
    'يبدأ الهدف من جديد كل يوم.',
  ],
  'L’objectif recommence chaque semaine. Un rappel part la veille.': [
    'The goal restarts every week. A reminder is sent the day before.',
    'يبدأ الهدف من جديد كل أسبوع. يصل تذكير في اليوم السابق.',
  ],
  'L’objectif recommence chaque vendredi. Un rappel part la veille.': [
    'The goal restarts every Friday. A reminder is sent the day before.',
    'يبدأ الهدف من جديد كل جمعة. يصل تذكير في اليوم السابق.',
  ],
  'Demain, l’objectif de « {title} » recommence.': [
    'Tomorrow, the goal for “{title}” restarts.',
    'غدًا يبدأ هدف «{title}» من جديد.',
  ],
  'Demain, certains objectifs recommencent.': [
    'Tomorrow, some goals restart.',
    'غدًا تبدأ بعض الأهداف من جديد.',
  ],
  'Le rappel reste affiché dans WirdLink la veille.': [
    'The reminder still appears in WirdLink the day before.',
    'يبقى التذكير ظاهرًا في WirdLink في اليوم السابق.',
  ],
  'La veille d’un nouveau cycle, une notification rappelle que l’objectif recommence.': [
    'The day before a new cycle, a notification says the goal is restarting.',
    'في اليوم السابق لدورة جديدة، يذكّر إشعار بأن الهدف سيبدأ من جديد.',
  ],
  'Ouvrir ce compte': ['Open this account', 'فتح هذا الحساب'],
  'à l’instant': ['just now', 'الآن'],
  'Connexion en cours…': ['Signing in…', 'جارٍ تسجيل الدخول…'],
  'Consultez votre boîte mail et ouvrez le lien pour vous connecter. Pensez aussi aux courriers indésirables.':
    [
      'Check your inbox and open the link to sign in. Also check your spam folder.',
      'افتح الرابط في بريدك لتسجيل الدخول. تحقق أيضًا من البريد غير المرغوب فيه.',
    ],
  'Continuer avec Google': ['Continue with Google', 'المتابعة باستخدام Google'],
  'Copier le code': ['Copy code', 'نسخ الرمز'],
  'Création du wird': ['Create a wird', 'إنشاء الورد'],
  'C’est fait !': ['All done!', 'تمّ!'],
  'Dernier jour': ['Last day', 'آخر يوم'],
  'Donnez un nom à votre wird.': ['Give your wird a name.', 'اختر اسمًا لوردك.'],
  'Effacer la recherche': ['Clear search', 'مسح البحث'],
  'Envoyez le lien et ce code uniquement aux personnes invitées.': [
    'Send this link and code only to invited people.',
    'أرسل الرابط والرمز إلى الأشخاص المدعوين فقط.',
  ],
  'Essayez un autre nom ou un autre wird.': ['Try another name or wird.', 'جرّب اسمًا أو وردًا آخر.'],
  'Ex. 1 000': ['E.g. 1,000', 'مثال: ١٠٠٠'],
  'Ex. 10': ['E.g. 10', 'مثال: ١٠'],
  'Ex. : Dahira de votre quartier': ['E.g. your local dahira', 'مثال: دائرة الحي'],
  'Ex. Avant de commencer : Fatiha ×1, Salatoul Fatihi ×7, Astaghfiroullah ×100.': [
    'E.g. before starting: Fatiha ×1, Salatoul Fatihi ×7, Astaghfiroullah ×100.',
    'مثال قبل البدء: الفاتحة ×١، صلاة الفاتح ×٧، أستغفر الله ×١٠٠.',
  ],
  'Ex. Awa': ['E.g. Awa', 'مثال: عائشة'],
  'Ex. Salat ala Nabi': ['E.g. Salat ala Nabi', 'مثال: الصلاة على النبي'],
  'Ex. Un wird pour notre famille, à partager ce vendredi.': [
    'E.g. a wird for our family to share this Friday.',
    'مثال: ورد لعائلتنا نشارك فيه يوم الجمعة.',
  ],
  Fermer: ['Close', 'إغلاق'],
  'Fermer l’invitation à installer': ['Close the install invitation', 'إغلاق دعوة التثبيت'],
  'Garder ce wird': ['Keep this wird', 'الاحتفاظ بهذا الورد'],
  'Garder le brouillon': ['Keep draft', 'الاحتفاظ بالمسودة'],
  'Garder le compteur': ['Keep counter', 'الاحتفاظ بالعداد'],
  'Garder mon compte': ['Keep my account', 'الاحتفاظ بحسابي'],
  'Invitez vos proches': ['Invite your loved ones', 'ادعُ أحباءك'],
  'Je participe encore': ['Join again', 'أشارك مجددًا'],
  'La vibration dépend de votre appareil et de ses réglages.': [
    'Vibration depends on your device and settings.',
    'يعتمد الاهتزاز على جهازك وإعداداته.',
  ],
  'La vibration n’a pas pu démarrer. Le compteur reste utilisable.': [
    'Vibration could not start. The counter still works.',
    'تعذر تشغيل الاهتزاز. يمكنك الاستمرار في استخدام العداد.',
  ],
  'Le modèle choisi remplacera le texte, les consignes et les fichiers du brouillon actuel.': [
    'This template will replace the text, instructions and files in your current draft.',
    'سيستبدل النموذج النص والتعليمات والملفات في المسودة الحالية.',
  ],
  'Le texte du brouillon est conservé ici. Photo et voix restent disponibles pendant cette session.':
    [
      'Draft text is saved here. Photo and audio remain available during this session.',
      'يُحفظ نص المسودة هنا. تبقى الصورة والصوت متاحين خلال هذه الجلسة.',
    ],
  'Le texte, la photo et la voix de ce brouillon seront retirés de cet appareil.': [
    'The text, photo and audio in this draft will be removed from this device.',
    'سيُحذف نص هذه المسودة وصورتها وصوتها من هذا الجهاز.',
  ],
  'Lectures terminées': ['Completed readings', 'القراءات المكتملة'],
  'Les lectures d’ouverture sont distinctes de l’objectif à partager.': [
    'Opening readings are separate from the shared goal.',
    'قراءات الافتتاح منفصلة عن الهدف المشترك.',
  ],
  'Les participations apparaîtront ici.': [
    'Contributions will appear here.',
    'ستظهر المشاركات هنا.',
  ],
  'Lien indisponible': ['Link unavailable', 'الرابط غير متاح'],
  'L’accès par code sera activé lors de la publication.': [
    'Code access will be enabled when published.',
    'سيُفعّل الدخول بالرمز عند النشر.',
  ],
  'Ma part': ['My share', 'حصتي'],
  'Ma part ·': ['My share ·', 'حصتي ·'],
  'Ma voix': ['My audio', 'صوتي'],
  'Merci !': ['Thank you!', 'شكرًا!'],
  Modifier: ['Edit', 'تعديل'],
  'Mon nom': ['My name', 'اسمي'],
  'Mon profil': ['My profile', 'ملفي الشخصي'],
  'Mon tasbih': ['My tasbih', 'تسبيحي'],
  'Mon wird': ['My wird', 'وردي'],
  'Nom du wird': ['Wird name', 'اسم الورد'],
  'Suggestions de nom': ['Name suggestions', 'اقتراحات الاسم'],
  'Objectif atteint !': ['Goal reached!', 'تم بلوغ الهدف!'],
  'Options du compteur': ['Counter options', 'خيارات العداد'],
  'Organisation ou dahira': ['Organization or dahira', 'المؤسسة أو الدائرة'],
  'Ouvrez d’abord le wird': ['Open the wird first', 'افتح الورد أولًا'],
  'Part introuvable': ['Share not found', 'الحصة غير موجودة'],
  'Partager un wird': ['Share a wird', 'مشاركة ورد'],
  Participants: ['Participants', 'المشاركون'],
  'Photo choisie pour le wird': ['Selected photo for the wird', 'الصورة المختارة للورد'],
  'Premier jour': ['First day', 'أول يوم'],
  'Publication en cours…': ['Publishing…', 'جارٍ النشر…'],
  'Quand ?': ['When?', 'متى؟'],
  'Qui peut voir ?': ['Who can view?', 'من يمكنه الاطلاع؟'],
  'Qu’Allah accepte votre part.': ['May Allah accept your contribution.', 'تقبّل الله قراءتكم.'],
  'Rappels et écran d’accueil': ['Reminders and home screen', 'التذكيرات والشاشة الرئيسية'],
  'Recevoir un lien de connexion': ['Send a sign-in link', 'إرسال رابط الدخول'],
  'Rechercher mes parts': ['Search my shares', 'البحث في حصصي'],
  'Recommencer à zéro': ['Start over', 'البدء من الصفر'],
  'Remettre à zéro': ['Reset', 'تصفير العداد'],
  'Remplacer le brouillon': ['Replace the draft', 'استبدال المسودة'],
  'Remplacer le brouillon ?': ['Replace draft?', 'استبدال المسودة؟'],
  Reprendre: ['Resume', 'استئناف'],
  'Rester connecté': ['Stay signed in', 'البقاء متصلًا'],
  'Retirer la photo': ['Remove photo', 'إزالة الصورة'],
  'Retirer la voix': ['Remove audio', 'إزالة الصوت'],
  'Retour à l’accueil': ['Back to home', 'العودة إلى الرئيسية'],
  'Retrouvez ce wird depuis son lien d’accès.': [
    'Open this wird using its access link.',
    'افتح هذا الورد باستخدام رابط الدخول.',
  ],
  'Retrouvez le wird depuis l’accueil pour le partager.': [
    'Find the wird on the home page to share it.',
    'ابحث عن الورد في الصفحة الرئيسية لمشاركته.',
  ],
  'Retrouvez vos lectures': ['Find your readings', 'اعثر على قراءاتك'],
  'Revenir à l’accueil': ['Return home', 'العودة إلى الرئيسية'],
  'Saisissez le code transmis par le responsable.': [
    'Enter the code provided by the organizer.',
    'أدخل الرمز الذي أرسله المسؤول.',
  ],
  'Saisissez une adresse email valide.': [
    'Enter a valid email address.',
    'أدخل بريدًا إلكترونيًا صالحًا.',
  ],
  'Sans nom': ['Anonymous', 'دون اسم'],
  'Se déconnecter ?': ['Sign out?', 'تسجيل الخروج؟'],
  'Seul ce compteur revient à zéro. Votre part reste réservée.': [
    'Only this counter resets. Your share stays reserved.',
    'يُصفّر هذا العداد فقط. تبقى حصتك محجوزة.',
  ],
  'Seuls les noms choisis sont affichés.': [
    'Only chosen names are displayed.',
    'تُعرض الأسماء المختارة فقط.',
  ],
  Suivant: ['Next', 'التالي'],
  'Suppression en cours…': ['Deleting…', 'جارٍ الحذف…'],
  Supprimer: ['Delete', 'حذف'],
  'Supprimer ce wird': ['Delete this wird', 'حذف هذا الورد'],
  'Supprimer ce wird ?': ['Delete this wird?', 'حذف هذا الورد؟'],
  'Supprimer définitivement': ['Delete permanently', 'الحذف نهائيًا'],
  'Supprimer le brouillon': ['Delete draft', 'حذف المسودة'],
  'Supprimer le brouillon ?': ['Delete draft?', 'حذف المسودة؟'],
  'Supprimer votre compte ?': ['Delete your account?', 'حذف حسابك؟'],
  Terminé: ['Done', 'مكتمل'],
  Tout: ['All', 'الكل'],
  'Bientôt disponible': ['Coming soon', 'قريبًا'],
  'Connexion par téléphone': ['Sign in by phone', 'تسجيل الدخول بالهاتف'],
  'Ce moyen n’est pas encore ouvert. Continuez avec Google ou un lien reçu par email.': [
    'This option is not open yet. Continue with Google or a link sent by email.',
    'هذه الوسيلة غير متاحة بعد. تابع عبر Google أو عبر رابط يصلك بالبريد.',
  ],
  'Un wird, un nom…': ['A wird, a name…', 'ورد، اسم…'],
  'Utiliser ce modèle': ['Use this template', 'استخدام هذا النموذج'],
  'Utilisez le lien d’accès du responsable pour retrouver cette lecture.': [
    'Use the organizer’s access link to find this reading.',
    'استخدم رابط المسؤول للوصول إلى هذه القراءة.',
  ],
  'Vibrer à chaque appui': ['Vibrate on each tap', 'اهتزاز مع كل ضغطة'],
  'Vibrer à l’objectif': ['Vibrate at goal', 'اهتزاز عند بلوغ الهدف'],
  'Voir les autres wirds': ['View other wirds', 'عرض أوراد أخرى'],
  'Voir l’aperçu': ['Preview', 'معاينة'],
  'Vos wirds sont conservés. Reconnectez-vous pour les retrouver.': [
    'Your wirds are saved. Sign in again to find them.',
    'أورادك محفوظة. سجّل الدخول مجددًا للوصول إليها.',
  ],
  'Votre aperçu': ['Your preview', 'معاينتك'],
  'Votre brouillon': ['Your draft', 'مسودتك'],
  'Votre brouillon reste enregistré jusqu’à la publication.': [
    'Your draft stays saved until publication.',
    'تبقى مسودتك محفوظة حتى النشر.',
  ],
  'Votre code d’accès': ['Your access code', 'رمز الدخول الخاص بك'],
  'Code d’accès et partage': ['Access code and sharing', 'رمز الدخول والمشاركة'],
  'Votre compte, vos wirds et toutes leurs participations seront supprimés définitivement. Vos parts dans d’autres wirds et votre brouillon sur cet appareil seront aussi supprimés.':
    [
      'Your account, your wirds and all their contributions will be permanently deleted. Your shares in other wirds and your draft on this device will also be deleted.',
      'سيُحذف حسابك وأورادك وجميع مشاركاتها نهائيًا، وكذلك حصصك في الأوراد الأخرى ومسودتك على هذا الجهاز.',
    ],
  'Votre connexion': ['Your sign-in', 'تسجيل الدخول'],
  'Votre email': ['Your email', 'بريدك الإلكتروني'],
  'Votre lecture a déjà été confirmée. Merci !': [
    'Your reading has already been confirmed. Thank you!',
    'تم تأكيد قراءتك بالفعل. شكرًا!',
  ],
  'Votre nom': ['Your name', 'اسمك'],
  'Votre nom affiché': ['Your display name', 'اسم العرض'],
  'Votre nom et votre organisation apparaîtront comme auteur de vos wirds.': [
    'Your name and organization will appear as the author of your wirds.',
    'سيظهر اسمك ومؤسستك بوصفك ناشر أورادك.',
  ],
  'Votre note vocale': ['Your audio note', 'مقطعك الصوتي'],
  'Votre prénom': ['Your first name', 'اسمك الأول'],
  'Vous n’avez pas encore participé': ['You have not joined yet', 'لم تشارك بعد'],
  'Vous pourrez confirmer une fois votre objectif atteint.': [
    'You can confirm when you reach your goal.',
    'يمكنك التأكيد عند بلوغ هدفك.',
  ],
  'Vérification de votre connexion…': ['Checking your sign-in…', 'جارٍ التحقق من تسجيل الدخول…'],
  'Vérification du code…': ['Checking code…', 'جارٍ التحقق من الرمز…'],
  'Wird indisponible': ['Wird unavailable', 'الورد غير متاح'],
  'Wird introuvable': ['Wird not found', 'الورد غير موجود'],
  'À quelle fréquence ?': ['How often?', 'كم مرة؟'],
  'à lire': ['to read', 'للقراءة'],
  'à prendre': ['available', 'متاحة'],
  lus: ['read', 'مقروءة'],
  lectures: ['readings', 'قراءات'],
  'lectures à partager': ['readings to share', 'قراءات للمشاركة'],
  'en cours': ['in progress', 'جارية'],
  'Chargement…': ['Loading…', 'جارٍ التحميل…'],
  'Lecture indisponible. Réessayez.': [
    'Playback unavailable. Try again.',
    'الاستماع غير متاح. حاول مجددًا.',
  ],
  'Ce fichier audio ne peut pas être lu.': [
    'This audio file cannot be played.',
    'تعذر تشغيل هذا الملف الصوتي.',
  ],
  'Plus d’options': ['More options', 'المزيد من الخيارات'],
  'Ce wird': ['This wird', 'هذا الورد'],
  Partager: ['Share', 'مشاركة'],
  Dupliquer: ['Duplicate', 'نسخ ورد مماثل'],
  'Modifier le wird': ['Edit wird', 'تعديل الورد'],
  'Enregistrer les modifications': ['Save changes', 'حفظ التعديلات'],
  Aperçu: ['Preview', 'معاينة'],
  Connexion: ['Sign in', 'تسجيل الدخول'],
  Profil: ['Profile', 'الملف الشخصي'],
  'Comment participer ?': ['How to participate?', 'كيف أشارك؟'],
  'Choisissez un wird, puis Je participe. Choisissez votre quantité et confirmez avec Je commence.':
    [
      'Choose a wird, then Join in. Choose your quantity and confirm with Start.',
      'اختر وردًا ثم «أشارك». حدد الكمية وأكد بالضغط على «أبدأ».',
    ],
  'Retrouvez vos engagements dans Mes parts. Touchez J’ai fini après votre lecture.': [
    'Find your commitments in My shares. Tap I’m done after reading.',
    'تجد التزاماتك في «حصصي». اضغط على «أتممت القراءة» بعد الانتهاء.',
  ],
  'Pour créer un wird, choisissez Créer, renseignez son nom et son objectif, puis vérifiez l’aperçu. Connectez-vous pour le publier.':
    [
      'To create a wird, choose Create, enter its name and goal, then check the preview. Sign in to publish.',
      'لإنشاء ورد، اختر «إنشاء»، وأدخل الاسم والهدف ثم تحقق من المعاينة. سجّل الدخول للنشر.',
    ],
  'Dans le menu Plus de votre wird, vous pouvez le modifier, le partager, le dupliquer ou le supprimer.':
    [
      'In your wird’s More menu, you can edit, share, duplicate or delete it.',
      'من قائمة «المزيد» في وردك، يمكنك تعديله أو مشاركته أو نسخ ورد مماثل أو حذفه.',
    ],
  'Dans Réglages, vous pouvez choisir la langue et le thème, ou installer l’application sur votre écran d’accueil.':
    [
      'In Settings, choose your language and theme, or add the app to your home screen.',
      'من «الإعدادات»، يمكنك اختيار اللغة والمظهر أو تثبيت التطبيق على الشاشة الرئيسية.',
    ],
  'Pour compter vos lectures, ouvrez Mes parts puis le compteur. Chaque appui ajoute une lecture. À la fin, confirmez avec J’ai fini.':
    [
      'To count readings, open My shares then the counter. Each tap adds one reading. When finished, confirm with I’m done.',
      'لعدّ القراءات، افتح «حصصي» ثم العداد. تضيف كل ضغطة قراءة واحدة. عند الانتهاء، أكد بالضغط على «أتممت القراءة».',
    ],
  'Votre brouillon et votre compteur restent sur cet appareil. Vos wirds et vos parts sont enregistrés avec votre session.':
    [
      'Your draft and counter stay on this device. Your wirds and shares are saved with your session.',
      'تبقى مسودتك وعدادك على هذا الجهاز. تُحفظ أورادك وحصصك مع جلستك.',
    ],
  'Vous pouvez vous connecter avec Google ou un lien reçu par email. Votre profil est facultatif.':
    [
      'You can sign in with Google or an email link. Your profile is optional.',
      'يمكنك تسجيل الدخول باستخدام Google أو رابط يصلك بالبريد الإلكتروني. ملفك الشخصي اختياري.',
    ],
  'Votre prénom, votre nom et votre organisation peuvent apparaître comme auteur de vos wirds. ': [
    'Your first name, last name and organization may appear as the author of your wirds.',
    'قد يظهر اسمك الأول واسم العائلة ومؤسستك بوصفك ناشر أورادك.',
  ],
  'Depuis Mon profil, vous pouvez modifier vos informations, vous déconnecter ou supprimer votre compte et vos wirds.':
    [
      'In My profile, you can edit your information, sign out, or delete your account and wirds.',
      'من «ملفي الشخصي»، يمكنك تعديل معلوماتك أو تسجيل الخروج أو حذف حسابك وأورادك.',
    ],
  'À la publication, vos photos et fichiers audio sont enregistrés dans un espace protégé et accessibles aux personnes autorisées à voir le wird.':
    [
      'When published, your photos and audio are saved in protected storage and are available to people allowed to view the wird.',
      'عند النشر، تُحفظ صورك وملفاتك الصوتية في مساحة محمية، ويصل إليها الأشخاص المصرح لهم بعرض الورد.',
    ],
  'Un wird public est visible par toute personne qui possède son lien. Un wird avec un code demande ce code. Partagez-le seulement avec les personnes de votre choix.':
    [
      'Anyone with the link can view a public wird. A code-protected wird requires its code. Share it only with people you choose.',
      'يمكن لأي شخص يملك الرابط عرض الورد العام. يتطلب الورد المحمي رمز الدخول. شاركه فقط مع من تختار.',
    ],
  'WirdLink est un projet bénévole et gratuit.': [
    'WirdLink is a free volunteer project.',
    'WirdLink مشروع تطوعي مجاني.',
  ],
  'Partagez un wird, choisissez votre part et comptez vos lectures simplement avec WirdLink.': [
    'Share a wird, choose your share and count your readings simply with WirdLink.',
    'شارك وردًا، واختر حصتك، وعدّ قراءاتك ببساطة مع WirdLink.',
  ],
  'Les parts sont réservées au moment de leur confirmation. Confirmez vos lectures terminées pour actualiser la progression collective.':
    [
      'Shares are reserved when confirmed. Confirm completed readings to update collective progress.',
      'تُحجز الحصص عند تأكيدها. أكد القراءات المكتملة لتحديث التقدم الجماعي.',
    ],
  'Publiez seulement les textes, images et audios que vous avez le droit de partager. Ne publiez pas les informations personnelles d’une autre personne sans son accord.':
    [
      'Only publish text, images and audio you have the right to share. Do not publish someone else’s personal information without their consent.',
      'انشر فقط النصوص والصور والأصوات التي يحق لك مشاركتها. لا تنشر معلومات شخص آخر دون موافقته.',
    ],
  'Ce choix reste appliqué pour cette session, mais n’a pas pu être enregistré.': [
    'This choice applies to this session but could not be saved.',
    'يُطبّق هذا الخيار خلال الجلسة، لكن تعذر حفظه.',
  ],
  'Ce code est incorrect ou a expiré. Vérifiez-le auprès du responsable.': [
    'This code is incorrect or expired. Check with the organizer.',
    'الرمز غير صحيح أو انتهت صلاحيته. تحقق منه مع المسؤول.',
  ],
  'Choisissez une quantité disponible pour activer « Je commence ».': [
    'Choose an available quantity to enable Start.',
    'اختر كمية متاحة لتفعيل «أبدأ».',
  ],
  'Code copié.': ['Code copied.', 'تم نسخ الرمز.'],
  'Connexion impossible pour le moment. Réessayez, votre brouillon est conservé.': [
    'Unable to sign in right now. Try again; your draft is saved.',
    'يتعذر تسجيل الدخول حاليًا. حاول مجددًا، مسودتك محفوظة.',
  ],
  'Connexion indisponible. Réessayez dans un instant.': [
    'Sign-in unavailable. Try again shortly.',
    'تسجيل الدخول غير متاح. حاول بعد قليل.',
  ],
  'Copie indisponible. Recopiez les 4 chiffres affichés.': [
    'Copy unavailable. Write down the 4 digits shown.',
    'النسخ غير متاح. دوّن الأرقام الأربعة الظاهرة.',
  ],
  'Enregistrement impossible. Vérifiez votre connexion et les parts déjà prises, puis réessayez.': [
    'Unable to save. Check your connection and reserved shares, then try again.',
    'تعذر الحفظ. تحقق من اتصالك والحصص المحجوزة ثم حاول مجددًا.',
  ],
  'Impossible de charger les wirds. Réessayez.': [
    'Unable to load wirds. Try again.',
    'تعذر تحميل الأوراد. حاول مجددًا.',
  ],
  'Impossible de charger votre profil. Réessayez.': [
    'Unable to load your profile. Try again.',
    'تعذر تحميل ملفك الشخصي. حاول مجددًا.',
  ],
  'Impossible de vous déconnecter. Réessayez.': [
    'Unable to sign out. Try again.',
    'تعذر تسجيل الخروج. حاول مجددًا.',
  ],
  'Impossible d’enregistrer votre profil. Vos modifications sont conservées.': [
    'Unable to save your profile. Your changes are preserved.',
    'تعذر حفظ ملفك الشخصي. تعديلاتك محفوظة.',
  ],
  'Impossible d’ouvrir ce wird. Réessayez dans un instant.': [
    'Unable to open this wird. Try again shortly.',
    'تعذر فتح هذا الورد. حاول بعد قليل.',
  ],
  'Installation demandée au navigateur.': [
    'Installation requested from the browser.',
    'تم طلب التثبيت من المتصفح.',
  ],
  'La confirmation a échoué. Réessayez.': [
    'Confirmation failed. Try again.',
    'فشل التأكيد. حاول مجددًا.',
  ],
  'La confirmation a échoué. Votre compteur est conservé. Réessayez.': [
    'Confirmation failed. Your count is saved. Try again.',
    'فشل التأكيد. عدّادك محفوظ. حاول مجددًا.',
  ],
  'La connexion a expiré. Recommencez pour continuer.': [
    'Your sign-in expired. Start again to continue.',
    'انتهت صلاحية تسجيل الدخول. أعد المحاولة للمتابعة.',
  ],
  'La connexion a été interrompue. Réessayez.': [
    'Sign-in was interrupted. Try again.',
    'انقطع تسجيل الدخول. حاول مجددًا.',
  ],
  'La date de début est passée. Choisissez aujourd’hui ou une date à venir.': [
    'The start date has passed. Choose today or a later date.',
    'فات تاريخ البدء. اختر اليوم أو تاريخًا لاحقًا.',
  ],
  'Commencer aujourd’hui': ['Start today', 'البدء اليوم'],
  'La participation sans compte n’est pas disponible pour le moment. Réessayez plus tard.': [
    'Participation without an account is unavailable right now. Try again later.',
    'المشاركة بدون حساب غير متاحة حاليًا. حاول لاحقًا.',
  ],
  'La part n’a pas pu être réservée. Vérifiez votre connexion et réessayez.': [
    'Unable to reserve your share. Check your connection and try again.',
    'تعذر حجز حصتك. تحقق من اتصالك وحاول مجددًا.',
  ],
  'La publication a échoué. Votre brouillon est conservé, vous pouvez réessayer.': [
    'Publishing failed. Your draft is saved; you can try again.',
    'فشل النشر. مسودتك محفوظة، يمكنك المحاولة مجددًا.',
  ],
  'La suppression n’est pas terminée. Réessayez pour la finaliser.': [
    'Deletion is incomplete. Try again to finish.',
    'لم يكتمل الحذف. حاول مجددًا لإتمامه.',
  ],
  'Le brouillon n’a pas pu être restauré. Vous pouvez en créer un nouveau.': [
    'Your draft could not be restored. You can create a new one.',
    'تعذر استعادة المسودة. يمكنك إنشاء مسودة جديدة.',
  ],
  'Le compteur enregistré n’a pas pu être restauré. Votre part reste réservée.': [
    'Your saved count could not be restored. Your share stays reserved.',
    'تعذر استعادة العداد المحفوظ. تبقى حصتك محجوزة.',
  ],
  'Le lien n’a pas pu être envoyé. Réessayez.': [
    'The link could not be sent. Try again.',
    'تعذر إرسال الرابط. حاول مجددًا.',
  ],
  'Le partage n’a pas pu être chargé. Réessayez.': [
    'Sharing options could not be loaded. Try again.',
    'تعذر تحميل خيارات المشاركة. حاول مجددًا.',
  ],
  'Le wird n’a pas pu être supprimé. Réessayez.': [
    'The wird could not be deleted. Try again.',
    'تعذر حذف الورد. حاول مجددًا.',
  ],
  'L’accès privé n’est pas encore disponible. Réessayez plus tard.': [
    'Private access is not available yet. Try again later.',
    'الوصول الخاص غير متاح بعد. حاول لاحقًا.',
  ],
  'Profil enregistré.': ['Profile saved.', 'تم حفظ الملف الشخصي.'],
  'Préparation du QR…': ['Preparing QR code…', 'جارٍ تجهيز رمز QR…'],
  'Reconnectez-vous pour confirmer votre lecture terminée.': [
    'Sign in again to confirm your completed reading.',
    'سجّل الدخول مجددًا لتأكيد إتمام قراءتك.',
  ],
  'Suppression locale indisponible. Le brouillon peut réapparaître au prochain démarrage.': [
    'Local deletion unavailable. The draft may reappear next time.',
    'الحذف المحلي غير متاح. قد تظهر المسودة مجددًا عند الفتح التالي.',
  ],
  'Trop de tentatives. Patientez avant de réessayer.': [
    'Too many attempts. Wait before trying again.',
    'محاولات كثيرة. انتظر قبل المحاولة مجددًا.',
  ],
  'Ce wird remplacera le texte, les consignes et le calendrier du brouillon actuel. Photo et voix devront être ajoutées à nouveau.':
    [
      'This wird will replace the text, instructions and schedule of the current draft. Photo and audio will need to be added again.',
      'سيستبدل هذا الورد نص المسودة الحالية وتعليماتها وجدولها. ستحتاج إلى إضافة الصورة والصوت من جديد.',
    ],
  'Votre compte a été supprimé.': ['Your account has been deleted.', 'تم حذف حسابك.'],
  'Votre part est réservée. Retrouvez-la dans Mes parts.': [
    'Your share is reserved. Find it in My shares.',
    'تم حجز حصتك. تجدها في «حصصي».',
  ],
  'Votre part est terminée. Retrouvez-la dans Mes parts.': [
    'Your share is complete. Find it in My shares.',
    'اكتملت حصتك. تجدها في «حصصي».',
  ],
  'Votre téléphone ne permet pas la sauvegarde. Gardez cette page ouverte pour retrouver vos parts.':
    [
      'Your phone cannot save your data. Keep this page open to find your shares.',
      'يتعذر الحفظ على هاتفك. أبقِ هذه الصفحة مفتوحة للوصول إلى حصصك.',
    ],
  'Vous pourrez l’ajouter plus tard.': ['You can add it later.', 'يمكنك إضافته لاحقًا.'],
  'Vous êtes déconnecté.': ['You are signed out.', 'تم تسجيل خروجك.'],
  'Vérifiez le nom et choisissez un objectif entier.': [
    'Check the name and choose a whole-number goal.',
    'تحقق من الاسم واختر هدفًا بعدد صحيح.',
  ],
  'WirdLink a été ajouté.': ['WirdLink has been added.', 'تمت إضافة WirdLink.'],
  'Écrivez un nombre entier supérieur ou égal à 1.': [
    'Enter a whole number of 1 or more.',
    'أدخل عددًا صحيحًا لا يقل عن ١.',
  ],
  'Écrivez votre nom (60 caractères maximum), ou choisissez Sans nom.': [
    'Enter your name (up to 60 characters), or choose Anonymous.',
    'أدخل اسمك (٦٠ حرفًا كحد أقصى) أو اختر «دون اسم».',
  ],
  'Le wird a été copié dans votre brouillon. Ajoutez à nouveau les photos et les fichiers audio si besoin.':
    [
      'The wird was copied to your draft. Add photos and audio files again if needed.',
      'نُسخ الورد إلى مسودتك. أضف الصور والملفات الصوتية مجددًا عند الحاجة.',
    ],
  'À votre façon': ['Your own way', 'بطريقتك'],
  'Choisissez un nombre entier entre 1 et 2 147 483 647.': [
    'Choose a whole number between 1 and 2,147,483,647.',
    'اختر عددًا صحيحًا بين ١ و٢٬١٤٧٬٤٨٣٬٦٤٧.',
  ],
  Compter: ['Count', 'عدّ'],
  comptées: ['counted', 'محسوبة'],
  'participations terminées': ['completed contributions', 'مشاركات مكتملة'],
  'participation terminée': ['completed contribution', 'مشاركة مكتملة'],
  participations: ['contributions', 'مشاركات'],
  participation: ['contribution', 'مشاركة'],
  'Publié par': ['Published by', 'نشره'],
  'Écrivez votre nom, ou choisissez « Sans nom ».': [
    'Enter your name, or choose Anonymous.',
    'أدخل اسمك أو اختر «دون اسم».',
  ],
  'Ce nom sera visible avec votre part. Vous pouvez rester sans nom.': [
    'This name will be visible with your share. You may stay anonymous.',
    'سيظهر الاسم مع حصتك. يمكنك المشاركة دون اسم.',
  ],
  'Toutes les parts sont prises': ['All shares are reserved', 'تم حجز جميع الحصص'],
  'Merci à toutes les personnes qui ont participé.': [
    'Thank you to everyone who contributed.',
    'شكرًا لكل من شارك.',
  ],
  'Des lectures sont encore en cours. Vous pouvez voir les participations.': [
    'Some readings are still in progress. You can view contributions.',
    'ما زالت بعض القراءات جارية. يمكنك عرض المشاركات.',
  ],
  'Reconnectez-vous pour commencer une part.': [
    'Reconnect to start a share.',
    'أعد الاتصال لبدء حصة.',
  ],
  'Toutes les parts sont prises pour le moment.': [
    'All shares are currently reserved.',
    'جميع الحصص محجوزة حاليًا.',
  ],
  'Écrivez votre nom ou choisissez « Sans nom » pour continuer.': [
    'Enter your name or choose Anonymous to continue.',
    'أدخل اسمك أو اختر «دون اسم» للمتابعة.',
  ],
  '+1 lecture': ['+1 reading', '+١ قراءة'],
  'Touchez le grand cercle pour compter': [
    'Tap the large circle to count',
    'اضغط على الدائرة الكبيرة للعدّ',
  ],
  'Confirmation…': ['Confirming…', 'جارٍ التأكيد…'],
  'Confirmez pour terminer votre part.': ['Confirm to complete your share.', 'أكد لإتمام حصتك.'],
  'Votre compteur est conservé. Reconnectez-vous pour confirmer.': [
    'Your count is saved. Reconnect to confirm.',
    'عدادك محفوظ. أعد الاتصال للتأكيد.',
  ],
  'Recommencer le compteur ?': ['Reset the counter?', 'إعادة بدء العداد؟'],
  'Étape {step} sur 3': ['Step {step} of 3', 'الخطوة {step} من ٣'],
  'sur {target}': ['out of {target}', 'من {target}'],
  'Encore {count} à lire': ['{count} left to read', 'متبقي {count} للقراءة'],
  '{count} lus sur {target}': ['{count} read out of {target}', 'قُرئت {count} من {target}'],
  'lus sur {target}': ['read out of {target}', 'مقروءة من {target}'],
  'Prendre les {count} lectures disponibles': [
    'Reserve all {count} available readings',
    'حجز القراءات المتاحة وعددها {count}',
  ],
  'Ajouter une lecture. {count} sur {target} comptées.': [
    'Add a reading. {count} out of {target} counted.',
    'إضافة قراءة. تم عدّ {count} من {target}.',
  ],
  'Il ne reste que {count}. Écrivez un nombre plus petit.': [
    'Only {count} left. Enter a smaller number.',
    'لم يتبقَّ سوى {count}. أدخل عددًا أصغر.',
  ],
  'Mon propre wird': ['My own wird', 'وردي الخاص'],
  '{count} lectures à prendre': ['{count} readings available', '{count} قراءة متاحة'],
  'Saisissez les 4 chiffres du code d’accès.': [
    'Enter the 4-digit access code.',
    'أدخل رمز الدخول المكوّن من ٤ أرقام.',
  ],
  'Ce code est différent du code de connexion à 6 chiffres.': [
    'This differs from the 6-digit sign-in code.',
    'يختلف هذا الرمز عن رمز تسجيل الدخول المكوّن من ٦ أرقام.',
  ],
  'Réessayer dans {seconds} s': ['Try again in {seconds} s', 'حاول مجددًا بعد {seconds} ث'],
  'Ouvrir le wird': ['Open wird', 'فتح الورد'],
  Objectif: ['Goal', 'الهدف'],
  'Au moins {minimum} : les parts déjà prises sont conservées.': [
    'At least {minimum}: existing reserved shares are preserved.',
    'لا يقل عن {minimum}: تبقى الحصص المحجوزة محفوظة.',
  ],
  'Description (facultatif)': ['Description (optional)', 'الوصف (اختياري)'],
  'Consignes (facultatif)': ['Instructions (optional)', 'التعليمات (اختياري)'],
  'Le calendrier, les fichiers et l’accès restent identiques pour les participants.': [
    'The schedule, files and access stay the same for participants.',
    'تبقى المواعيد والملفات وطريقة الدخول كما هي للمشاركين.',
  ],
  'Enregistrement…': ['Saving…', 'جارٍ الحفظ…'],
  'Modification indisponible': ['Editing unavailable', 'التعديل غير متاح'],
  'Seul l’auteur peut modifier ce wird.': [
    'Only the author can edit this wird.',
    'يمكن للناشر فقط تعديل هذا الورد.',
  ],
  'Vues du wird': ['Wird views', 'عرض الورد'],
  'Choisissez une photo JPEG, PNG ou WebP de 10 Mo maximum.': [
    'Choose a JPEG, PNG or WebP photo up to 10 MB.',
    'اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز ١٠ ميغابايت.',
  ],
  'Choisissez un audio MP3, M4A, WAV, OGG ou WebM de 10 Mo maximum.': [
    'Choose an MP3, M4A, WAV, OGG or WebM audio file up to 10 MB.',
    'اختر صوتًا MP3 أو M4A أو WAV أو OGG أو WebM بحجم لا يتجاوز ١٠ ميغابايت.',
  ],
  'QR code pour ouvrir WirdLink sur le téléphone': [
    'QR code to open WirdLink on your phone',
    'رمز QR لفتح WirdLink على الهاتف',
  ],
  'QR indisponible': ['QR unavailable', 'رمز QR غير متاح'],
  'Impossible de charger les participations.': [
    'Unable to load contributions.',
    'تعذر تحميل المشاركات.',
  ],
  'Reconnectez-vous pour commencer une nouvelle part.': [
    'Reconnect to start a new share.',
    'أعد الاتصال لبدء حصة جديدة.',
  ],
  'La sauvegarde locale est indisponible. Gardez cette page ouverte.': [
    'Local saving is unavailable. Keep this page open.',
    'الحفظ المحلي غير متاح. أبقِ هذه الصفحة مفتوحة.',
  ],
  'Ajout indisponible. Utilisez le menu de votre navigateur.': [
    'Unable to add the app. Use your browser menu.',
    'تعذرت إضافة التطبيق. استخدم قائمة المتصفح.',
  ],
  Merci: ['Thank you', 'شكرًا'],
  'Aller au contenu': ['Skip to content', 'انتقل إلى المحتوى'],
  'Navigation principale': ['Main navigation', 'التنقل الرئيسي'],
  Accueil: ['Home', 'الرئيسية'],
  'Mes parts': ['My shares', 'حصصي'],
  Créer: ['Create', 'إنشاء'],
  Aide: ['Help', 'المساعدة'],
  'Vos informations': ['Your information', 'معلوماتك'],
  'Règles d’utilisation': ['Terms of use', 'شروط الاستخدام'],
  'Hors ligne · vos parts restent consultables.': [
    'Offline · your shares remain available.',
    'أنت غير متصل · لا يزال بإمكانك الاطلاع على حصصك.',
  ],
  'Ouvrir WirdLink sur le téléphone': ['Open WirdLink on your phone', 'افتح WirdLink على هاتفك'],
  'À ouvrir sur le téléphone.': ['Open on your phone.', 'افتح التطبيق على هاتفك.'],
  'Pas de compte pour participer.': [
    'No account needed to participate.',
    'لا تحتاج إلى حساب للمشاركة.',
  ],
  'Accès local': ['Local access', 'وصول محلي'],
  'Scannez pour ouvrir sur votre téléphone.': [
    'Scan to open on your phone.',
    'امسح الرمز لفتح التطبيق على هاتفك.',
  ],
  'Le QR sera disponible sur une adresse accessible au téléphone.': [
    'The QR code is available when the address is accessible from your phone.',
    'يتوفر رمز QR عندما يكون العنوان متاحًا من هاتفك.',
  ],
  'Envoyer ce wird': ['Share this wird', 'شارك هذا الورد'],
  'Partager WirdLink': ['Share WirdLink', 'شارك WirdLink'],
  'WirdLink, accueil': ['WirdLink, home', 'WirdLink، الرئيسية'],
  'Compte de': ['Account of', 'حساب'],
  'Votre compte': ['Your account', 'حسابك'],
  Réglages: ['Settings', 'الإعدادات'],
  'Mes wirds': ['My wirds', 'أورادي'],
  Réessayer: ['Try again', 'حاول مجددًا'],
  wirds: ['wirds', 'أوراد'],
  wird: ['wird', 'ورد'],
  'Aucun wird pour le moment': ['No wirds yet', 'لا توجد أوراد بعد'],
  'Créez votre premier wird pour commencer.': [
    'Create your first wird to get started.',
    'أنشئ وردك الأول للبدء.',
  ],
  'Créer un wird': ['Create a wird', 'إنشاء ورد'],
  'Aucun wird ici': ['No wirds found', 'لا توجد أوراد هنا'],
  'Essayez d’autres filtres pour retrouver un wird.': [
    'Try other filters to find a wird.',
    'جرّب مرشحات أخرى للعثور على ورد.',
  ],
  'Effacer les filtres': ['Clear filters', 'مسح المرشحات'],
  Pris: ['Taken', 'محجوز'],
  'Lectures comptées': ['Counted readings', 'القراءات المعدودة'],
  '{count} sur {target} comptées': ['{count} of {target} counted', '{count} من {target} معدودة'],
  Commencer: ['Start', 'ابدأ'],
  'J’ai déjà fini': ['I already finished', 'أتممت بالفعل'],
  'Tout afficher': ['Show all', 'عرض الكل'],
  Toutes: ['All', 'الكل'],
  'Voir mes parts': ['Show my shares', 'عرض حصصي'],
  'À propos de ce wird': ['About this wird', 'عن هذا الورد'],
  'Visible avec votre part. Laissez vide pour rester anonyme.': [
    'Shown with your share. Leave empty to stay anonymous.',
    'يظهر مع حصتك. اتركه فارغًا لتبقى مجهولًا.',
  ],
  'Objectif atteint': ['Goal reached', 'تحقق الهدف'],
  'Tour {round} sur {rounds}': ['Round {round} of {rounds}', 'الدورة {round} من {rounds}'],
  'Touchez le chapelet pour compter': ['Tap the beads to count', 'المس السبحة للعد'],
  Enregistrement: ['Recording', 'تسجيل'],
  Arrêter: ['Stop', 'إيقاف'],
  Importer: ['Import', 'استيراد'],
  Photo: ['Photo', 'صورة'],
  'Le micro n’est pas accessible. Autorisez-le, ou importez un fichier.': [
    'The microphone is unavailable. Allow it, or import a file.',
    'الميكروفون غير متاح. اسمح به أو استورد ملفًا.',
  ],
  'Aucun wird en cours': ['No active wirds', 'لا توجد أوراد جارية'],
  'Lancez un nouveau wird quand vous êtes prêt.': [
    'Start a new wird whenever you are ready.',
    'ابدأ وردًا جديدًا متى كنت مستعدًا.',
  ],
  'wirds en cours': ['active wirds', 'أوراد جارية'],
  'wird en cours': ['active wird', 'ورد جارٍ'],
  'Les wirds terminés sont juste en dessous.': [
    'Completed wirds are just below.',
    'الأوراد المكتملة أدناه مباشرة.',
  ],
  'Wirds terminés': ['Completed wirds', 'الأوراد المكتملة'],
  'Ce wird commence {day}.': ['This wird starts on {day}.', 'يبدأ هذا الورد يوم {day}.'],
  'Objectif atteint. Il recommence demain.': [
    'Goal reached. It starts again tomorrow.',
    'تحقق الهدف. يبدأ من جديد غدًا.',
  ],
  'Objectif atteint. Il recommence {day}.': [
    'Goal reached. It starts again on {day}.',
    'تحقق الهدف. يبدأ من جديد يوم {day}.',
  ],
  Apparence: ['Appearance', 'المظهر'],
  'Choisir le thème': ['Choose a theme', 'اختر المظهر'],
  Automatique: ['Automatic', 'تلقائي'],
  Clair: ['Light', 'فاتح'],
  Sombre: ['Dark', 'داكن'],
  'Suit le thème de votre appareil.': ['Follows your device theme.', 'يتبع مظهر جهازك.'],
  Langue: ['Language', 'اللغة'],
  'Choisir la langue': ['Choose a language', 'اختر اللغة'],
  'Les rappels': ['Reminders', 'التذكيرات'],
  'Recevez un rappel pour vos lectures. Ce choix reste facultatif.': [
    'Get reminders for your readings. This is optional.',
    'تلقَّ تذكيرًا بقراءاتك. هذا الخيار اختياري.',
  ],
  'Ce navigateur ne propose pas les notifications. Vous pouvez continuer sans rappel.': [
    'This browser does not support notifications. You can continue without reminders.',
    'هذا المتصفح لا يدعم الإشعارات. يمكنك المتابعة دون تذكير.',
  ],
  'Les notifications sont bloquées. Vous pouvez modifier ce choix dans les réglages du navigateur.':
    [
      'Notifications are blocked. You can change this in your browser settings.',
      'الإشعارات محظورة. يمكنك تغيير ذلك في إعدادات المتصفح.',
    ],
  'Désactiver les rappels': ['Turn off reminders', 'إيقاف التذكيرات'],
  'Activer les rappels': ['Turn on reminders', 'تفعيل التذكيرات'],
  'Rappels activés sur cet appareil.': [
    'Reminders enabled on this device.',
    'تم تفعيل التذكيرات على هذا الجهاز.',
  ],
  'Mise à jour des rappels…': ['Updating reminders…', 'جارٍ تحديث التذكيرات…'],
  'Les rappels ne sont pas encore disponibles. Aucun rappel n’a été activé.': [
    'Reminders are not available yet. No reminder has been enabled.',
    'التذكيرات غير متوفرة بعد. لم يتم تفعيل أي تذكير.',
  ],
  'Retrouver WirdLink facilement': ['Keep WirdLink handy', 'الوصول إلى WirdLink بسهولة'],
  'WirdLink est ouvert depuis votre écran d’accueil.': [
    'WirdLink is open from your home screen.',
    'تم فتح WirdLink من شاشتك الرئيسية.',
  ],
  'Ajouter à mon écran d’accueil': ['Add to my home screen', 'إضافة إلى الشاشة الرئيسية'],
  'Dans Safari, ouvrez le menu Partager, puis choisissez « Sur l’écran d’accueil » si cette option est proposée.':
    [
      'In Safari, open Share, then choose “Add to Home Screen” if available.',
      'في Safari، افتح قائمة المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية» إن كان الخيار متاحًا.',
    ],
  'Ouvrez le menu de votre navigateur, puis choisissez l’option d’ajout à l’écran d’accueil si elle est proposée. Vous pouvez aussi garder ce lien dans vos favoris.':
    [
      'Open your browser menu and choose Add to Home Screen if available. You can also bookmark this link.',
      'افتح قائمة المتصفح واختر الإضافة إلى الشاشة الرئيسية إن كانت متاحة. يمكنك أيضًا حفظ الرابط في المفضلة.',
    ],
  'À propos de WirdLink': ['About WirdLink', 'عن WirdLink'],
  Retour: ['Back', 'رجوع'],
  'En cours': ['In progress', 'جارية'],
  Terminés: ['Completed', 'مكتملة'],
  Filtrer: ['Filter', 'تصفية'],
  Tous: ['All', 'الكل'],
  'Tout le monde': ['Everyone', 'الجميع'],
  'Avec un code': ['With a code', 'برمز'],
  'Une fois': ['Once', 'مرة واحدة'],
  'Tous les jours': ['Every day', 'كل يوم'],
  'Chaque semaine': ['Every week', 'كل أسبوع'],
  'Chaque vendredi': ['Every Friday', 'كل جمعة'],
  Écouter: ['Listen', 'استماع'],
  Pause: ['Pause', 'إيقاف مؤقت'],
  'Je participe': ['Join in', 'أشارك'],
  'Je commence': ['Start', 'أبدأ'],
  'J’ai fini': ['I’m done', 'أتممت القراءة'],
  'Le wird': ['The wird', 'الورد'],
  'Les participants': ['Participants', 'المشاركون'],
  Description: ['Description', 'الوصف'],
  Consignes: ['Instructions', 'التعليمات'],
  Public: ['Public', 'عام'],
  Bientôt: ['Coming soon', 'قريبًا'],
  Téléphone: ['Phone', 'الهاتف'],
  Email: ['Email', 'البريد الإلكتروني'],
  'Se connecter avec Google': ['Sign in with Google', 'المتابعة باستخدام Google'],
  'Se déconnecter': ['Sign out', 'تسجيل الخروج'],
  'Supprimer mon compte': ['Delete my account', 'حذف حسابي'],
  Enregistrer: ['Save', 'حفظ'],
  Annuler: ['Cancel', 'إلغاء'],
  Prénom: ['First name', 'الاسم الأول'],
  Nom: ['Last name', 'اسم العائلة'],
  Organisation: ['Organization', 'المؤسسة'],
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<Locale>('fr');
  readonly locale = this.selected.asReadonly();
  readonly languages: readonly { value: Locale; label: string }[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
  ];

  constructor() {
    let locale: Locale = 'fr';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar' || stored === 'fr') locale = stored;
    } catch {
      /* Default French remains usable when storage is restricted. */
    }
    this.apply(locale);
  }

  setLocale(locale: Locale): void {
    if (locale !== 'fr' && locale !== 'en' && locale !== 'ar') return;
    this.apply(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* Preference stays active in this tab. */
    }
  }

  translate(key: string, parameters: Readonly<Record<string, string | number>> = {}): string {
    const locale = this.locale();
    const text = locale === 'fr' ? key : (TRANSLATIONS[key]?.[locale === 'en' ? 0 : 1] ?? key);
    return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
      const value = parameters[name];
      return value === undefined
        ? placeholder
        : typeof value === 'number'
          ? new Intl.NumberFormat(locale).format(value)
          : value;
    });
  }

  private apply(locale: Locale): void {
    this.selected.set(locale);
    this.document.documentElement.lang = locale;
    this.document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }
}
