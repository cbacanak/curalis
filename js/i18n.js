/* Dil desteği — Türkçe (varsayılan) ve İngilizce.
 * Sözlük anahtarları noktalı kısa adlardır; değer düz metin ("{n}" yer tutucu) ya da parametre alan fonksiyondur.
 * Seçim localStorage'da tutulur; seçim yoksa tarayıcı dili Türkçe ise tr, değilse en.
 * Kayıtlı veri her zaman Türkçe kanonik değerlerle saklanır (işlem türü, anestezi, kontrol adı);
 * görüntülerken procLabel / anesthesiaLabel / apptLabel ile çevrilir. Bu dosya başka modül içe aktarmaz.
 */
const KEY = 'hasta-takip:lang';
export const LANGS = [['tr', 'Türkçe'], ['en', 'English']];
const LOCALES = { tr: 'tr-TR', en: 'en-GB' };

let current = null;
function detect() {
  try { const s = localStorage.getItem(KEY); if (s === 'tr' || s === 'en') return s; } catch { /* yok say */ }
  const nav = (navigator.language || 'tr').toLowerCase();
  return nav.startsWith('tr') ? 'tr' : 'en';
}
export function getLang() { if (!current) current = detect(); return current; }
export function setLang(l) {
  current = l === 'en' ? 'en' : 'tr';
  try { localStorage.setItem(KEY, current); } catch { /* yok say */ }
  document.documentElement.lang = current;
}
export function locale() { return LOCALES[getLang()]; }
export const lower = (s) => String(s || '').toLocaleLowerCase(locale());
export const upper = (s) => String(s || '').toLocaleUpperCase(locale());
export const cmp = (a, b) => String(a).localeCompare(String(b), locale());
const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const TR = {
  'app.name': 'Hasta Takip',
  'nav.patients': 'Hastalar', 'nav.calendar': 'Ajanda', 'nav.settings': 'Ayarlar', 'nav.foot': 'Veriler bu cihazda saklanır.',
  'common.back': 'Geri', 'common.cancel': 'Vazgeç', 'common.close': 'Kapat', 'common.save': 'Kaydet', 'common.delete': 'Sil', 'common.edit': 'Düzenle',
  'common.more': 'Diğer', 'common.ok': 'Tamam', 'common.yes': 'Evet', 'common.sure': 'Emin misiniz?', 'common.all': 'Tümü', 'common.optional': '· isteğe bağlı',
  'common.selected': '· {n} seçili', 'common.updated': 'Güncellendi', 'common.deleted': 'Silindi', 'common.unnamed': 'İsimsiz', 'common.remove': 'Kaldır',
  'common.today': 'Bugün', 'common.tomorrow': 'Yarın', 'common.yesterday': 'Dün',
  'common.error': 'Bir hata oluştu', 'common.home': 'Ana sayfaya dön', 'common.dbFail': 'Veritabanı açılamadı', 'common.newVersion': 'Yeni sürüm hazır, sayfayı yenileyin',
  'common.saveFail': 'Kaydedilemedi', 'common.imgFail': 'Görsel okunamadı',
  'db.blocked': 'Veritabanı başka bir sekmede açık.', 'db.aborted': 'İşlem iptal edildi', 'db.badBackup': 'Geçersiz yedek dosyası.',
  'age': '{n} yaş',
  'rel.after': (p) => `${p.n} ${p.u} sonra`, 'rel.before': (p) => `${p.n} ${p.u} önce`,
  'unit.day': 'gün', 'unit.week': 'hafta', 'unit.month': 'ay', 'unit.year': 'yıl',
  'unit1.day': 'gün', 'unit1.week': 'hafta', 'unit1.month': 'ay', 'unit1.year': 'yıl',
  'since.pre': 'işlem öncesi', 'since.day0': 'işlem günü', 'since.nth': (p) => `${p.n}. ${p.u}`,
  'days.n': '{n} gün', 'days.late': '{n} gün gecikti',
  'status.late': 'Gecikti', 'status.planned': 'Planlı', 'status.done': 'Yapıldı', 'status.missed': 'Gelmedi', 'status.cancelled': 'İptal',
  'gender.F': 'Kadın', 'gender.M': 'Erkek', 'gender.none': 'Belirtilmedi',
  'phase.before': 'Öncesi', 'phase.after': 'Sonrası',
  'kind.kontrol': 'Kontrol', 'kind.muayene': 'Muayene', 'kind.operasyon': 'Operasyon', 'kind.pansuman': 'Pansuman', 'kind.diger': 'Diğer', 'kind.default': 'Randevu',
  'sched.d1': '1. Gün Kontrolü', 'sched.w1': '1. Hafta Kontrolü', 'sched.m1': '1. Ay Kontrolü', 'sched.m3': '3. Ay Kontrolü', 'sched.m6': '6. Ay Kontrolü', 'sched.y1': '1. Yıl Kontrolü',
  'sched.short.d1': '1. gün', 'sched.short.w1': '1. hafta', 'sched.short.m1': '1. ay', 'sched.short.m3': '3. ay', 'sched.short.m6': '6. ay', 'sched.short.y1': '1. yıl',
  'anest.Genel': 'Genel', 'anest.Lokal': 'Lokal', 'anest.Sedasyon': 'Sedasyon', 'anest.Lokal + Sedasyon': 'Lokal + Sedasyon', 'anest.Yok': 'Yok',
  'anest.line': '{a} anestezi',
  // Formlar
  'form.patient.new': 'Yeni hasta', 'form.patient.edit': 'Hastayı düzenle', 'form.patient.save': 'Hastayı kaydet',
  'form.firstName': 'Ad', 'form.lastName': 'Soyad', 'form.phone': 'Telefon', 'form.phone.ph': '05xx xxx xx xx', 'form.birthDate': 'Doğum tarihi',
  'form.gender': 'Cinsiyet', 'form.bloodType': 'Kan grubu', 'form.bloodType.unknown': 'Bilinmiyor', 'form.email': 'E-posta',
  'form.allergies': 'Alerjiler', 'form.allergies.ph': 'Penisilin, lateks…', 'form.referral': 'Yönlendiren', 'form.referral.ph': 'Tavsiye, sosyal medya, hekim…',
  'form.notes': 'Notlar', 'form.notes.ph': 'Sistemik hastalıklar, ilaçlar, sigara, beklentiler…', 'form.nameRequired': 'Ad ve soyad zorunludur.',
  'form.proc.new': 'Yeni işlem', 'form.proc.edit': 'İşlemi düzenle', 'form.proc.save': 'İşlemi kaydet', 'form.proc.type': 'İşlem türü',
  'form.proc.title': 'Açıklama / teknik', 'form.proc.title.ph': 'Açık teknik, kıkırdak greft…', 'form.proc.date': 'İşlem tarihi', 'form.proc.anesthesia': 'Anestezi',
  'form.proc.notes': 'Ameliyat notu', 'form.proc.notes.ph': 'Bulgular, uygulanan teknik, komplikasyon, öneriler…', 'form.proc.controls': 'Kontrol takvimi',
  'form.proc.controlTime': 'Kontrol saati', 'form.proc.controlsHint': 'Seçili dönemler işlem tarihine göre randevu olarak eklenir; pazara düşenler pazartesiye alınır.',
  'form.proc.typeRequired': 'İşlem türü seçin.', 'form.proc.dateRequired': 'İşlem tarihi zorunludur.',
  'form.appt.new': 'Yeni randevu', 'form.appt.edit': 'Randevuyu düzenle', 'form.appt.save': 'Randevuyu kaydet', 'form.appt.date': 'Tarih', 'form.appt.time': 'Saat',
  'form.appt.kind': 'Tür', 'form.appt.status': 'Durum', 'form.appt.label': 'Başlık', 'form.appt.label.ph': 'Dikiş alımı, pansuman, 2. hafta kontrolü…',
  'form.appt.proc': 'Bağlı işlem', 'form.appt.noProc': 'Bağlı işlem yok', 'form.appt.note': 'Not', 'form.appt.required': 'Tarih ve saat zorunludur.',
  'form.photo.title': 'Fotoğraf ekle', 'form.photo.save': 'Fotoğrafları ekle', 'form.photo.pick': 'Galeriden seç',
  'form.photo.pickHint': 'Birden fazla fotoğraf seçebilirsiniz. Küçültülmüş kopya saklanır, orijinal cihazınızda kalır.',
  'form.photo.phase': 'Aşama', 'form.photo.date': 'Çekim tarihi', 'form.photo.tags': 'Etiketler', 'form.photo.tags.ph': 'Profil, Ön, Bazal… (virgülle ayır)', 'form.photo.tags.ph2': 'Profil, Ön, Bazal…',
  'form.photo.picked': '{n} fotoğraf seçildi · daha ekle',
  'form.photo.exifMany': 'Fotoğrafların çekim tarihleri farklı; her biri kendi tarihiyle kaydedilir.',
  'form.photo.exifAll': 'Çekim tarihi fotoğraftan alındı.',
  'form.photo.exifSome': 'Çekim tarihi fotoğraftan alındı; tarih bilgisi olmayanlar bu tarihle kaydedilir.',
  'form.photo.exifManual': 'Tüm fotoğraflar seçtiğiniz tarihle kaydedilir.',
  'form.photo.none': 'En az bir fotoğraf seçin.', 'form.photo.processing': 'İşleniyor {i}/{n}',
  'form.photo.saveFail': (p) => `"${p.name}" kaydedilemedi: ${p.err}.${p.done ? ` ${p.done} fotoğraf kaydedildi.` : ''}`,
  'form.photo.added': '{n} fotoğraf eklendi', 'form.photo.info': 'Fotoğraf bilgileri',
  // Hastalar
  'patients.title': 'Hastalar', 'patients.count': '{n} kayıt', 'patients.upcoming': '{n} yaklaşan kontrol', 'patients.new': 'Yeni hasta',
  'patients.search.ph': 'Ad, soyad veya telefon', 'patients.search': 'Hasta ara', 'patients.added': 'Hasta eklendi', 'patients.noProc': 'Henüz işlem yok',
  'patients.empty': 'Henüz hasta yok', 'patients.emptyText': 'İlk hasta kartını oluşturarak başla.', 'patients.noResult': 'Sonuç yok',
  'patients.noMatch': '"{q}" ile eşleşen hasta bulunamadı.', 'patients.upcomingLabel': 'Yaklaşan kontrol', 'patients.results': '{n} sonuç', 'patients.all': 'Tüm hastalar',
  // Ajanda
  'cal.title': 'Ajanda', 'cal.todayCount': 'bugün {n} randevu', 'cal.list': 'Liste', 'cal.month': 'Takvim', 'cal.overdue': 'Gecikmiş · {n}',
  'cal.upcoming': 'Yaklaşan kontrol', 'cal.emptyList': 'Önümüzdeki {n} günde randevu yok', 'cal.emptyListText': 'İşlem eklendiğinde kontrol takvimi buraya düşer.',
  'cal.later': (p) => `${p.days} günden sonra ${p.n} planlı randevu daha var.`, 'cal.count': '{n} randevu', 'cal.prev': 'Önceki ay', 'cal.next': 'Sonraki ay',
  'cal.weekdays': () => ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], 'cal.add': 'Randevu ekle', 'cal.noneDay': 'Bu günde randevu yok.', 'cal.noneMonth': 'Bu ayda randevu yok.',
  'cal.addPatientFirst': 'Önce hasta ekleyin', 'cal.whichPatient': 'Hangi hasta için?', 'cal.added': 'Randevu eklendi', 'cal.openPatient': 'Hasta kartını aç',
  'cal.deletedPatient': 'Silinmiş hasta',
  'appt.markDone': 'Yapıldı olarak işaretle', 'appt.markMissed': 'Gelmedi', 'appt.markPlanned': 'Planlıya al', 'appt.editDate': 'Düzenle / tarihi değiştir',
  'appt.openProc': 'İşlemi aç · {p}', 'appt.delete': 'Randevuyu sil', 'appt.deleteQ': 'Randevu silinsin mi?', 'appt.deleted': 'Randevu silindi', 'appt.updated': 'Randevu güncellendi',
  'appt.doneToast': 'Yapıldı olarak işaretlendi', 'appt.missedToast': 'Gelmedi olarak işaretlendi', 'appt.plannedToast': 'Planlıya alındı',
  // Hasta kartı
  'p.title': 'Hasta', 'p.notFound': 'Hasta bulunamadı', 'p.notFoundText': 'Kayıt silinmiş olabilir.', 'p.backToList': 'Hasta listesine dön',
  'p.updated': 'Hasta bilgileri güncellendi', 'p.editInfo': 'Bilgileri düzenle', 'p.addPhoto': 'Fotoğraf ekle', 'p.addAppt': 'Randevu ekle', 'p.delete': 'Hastayı sil',
  'p.deleteQ': 'Hasta silinsin mi?', 'p.deleteMsg': (p) => `${p.name} ile birlikte ${p.procs} işlem, ${p.photos} fotoğraf ve ${p.appts} randevu kalıcı olarak silinecek.`,
  'p.deleted': 'Hasta silindi', 'p.procAdded': 'İşlem eklendi', 'p.procAddedControls': 'İşlem eklendi · {n} kontrol planlandı', 'p.apptAdded': 'Randevu eklendi',
  'p.call': 'Ara', 'p.addProc': 'İşlem ekle', 'p.noProc': 'Henüz işlem yok', 'p.noInfo': 'Bilgi girilmedi',
  'p.stat.procs': 'işlem', 'p.stat.photos': 'fotoğraf', 'p.stat.noControl': 'Planlı kontrol yok',
  'p.tab.general': 'Genel', 'p.tab.procs': 'İşlemler', 'p.tab.photos': 'Fotoğraflar', 'p.tab.appts': 'Randevular',
  'p.allergy': 'Alerji', 'p.overdueAlert': (p) => `${p.n} gecikmiş kontrol · ${p.list}`, 'p.registered': 'Kayıt',
  'p.recentPhotos': 'Son fotoğraflar', 'p.noPhotos': 'Henüz fotoğraf yok', 'p.noPhotosText': 'İlk öncesi fotoğrafını ekle.', 'p.upcomingControls': 'Yaklaşan kontroller',
  'p.controls': '{done}/{n} kontrol', 'p.photosN': '{n} fotoğraf',
  'p.noProcText': 'İşlem eklendiğinde 1. gün, 1. hafta, 1. ay, 3. ay, 6. ay ve 1. yıl kontrolleri otomatik planlanır.',
  'p.proc.date': 'Tarih', 'p.proc.since': 'Geçen süre', 'p.proc.anesthesia': 'Anestezi', 'p.proc.technique': 'Teknik', 'p.proc.photo': 'Fotoğraf',
  'p.proc.photoLine': (p) => `${p.n} · ${p.before} öncesi, ${p.after} sonrası`, 'p.proc.note': 'Ameliyat notu', 'p.proc.controls': 'Kontrol takvimi',
  'p.proc.doneOf': '{done}/{n} yapıldı', 'p.proc.noControls': 'Bu işlem için kontrol takvimi yok.', 'p.proc.makeControls': 'Kontrol takvimi oluştur',
  'p.proc.otherAppts': 'Diğer randevular', 'p.proc.updated': 'İşlem güncellendi', 'p.proc.controlsMade': 'Kontrol takvimi oluşturuldu',
  'p.proc.regen': 'Kontrol takvimini yeniden oluştur', 'p.proc.delete': 'İşlemi sil', 'p.proc.regenQ': 'Kontroller yeniden oluşturulsun mu?',
  'p.proc.regenMsg': 'Bu işleme bağlı otomatik kontroller silinip işlem tarihine göre yeniden planlanır. Durum bilgileri kaybolur.', 'p.proc.regenOk': 'Yeniden oluştur',
  'p.proc.regenerated': 'Kontrol takvimi yenilendi', 'p.proc.deleteQ': 'İşlem silinsin mi?',
  'p.proc.deleteMsg': (p) => `${p.type} kaydı ve ${p.n} otomatik kontrol randevusu silinecek. Fotoğraflar korunur.`, 'p.proc.deleted': 'İşlem silindi',
  'p.appt.overdue': 'Gecikmiş', 'p.appt.upcoming': 'Yaklaşan', 'p.appt.past': 'Geçmiş', 'p.appt.empty': 'Randevu yok',
  'p.appt.emptyText': 'İşlem eklediğinde kontrol takvimi otomatik oluşur. Serbest randevu da ekleyebilirsin.',
  'p.photo.unlinked': 'İşleme bağlı olmayan', 'p.photo.noMatch': 'Bu filtreye uyan fotoğraf yok', 'p.photo.show': 'Göster', 'p.photo.compare': 'Karşılaştır',
  'p.photo.pickBefore': 'Bir öncesi seç', 'p.photo.pickAfter': 'bir sonrası seç', 'p.photo.viewer': 'Fotoğraf', 'p.photo.prev': 'Önceki', 'p.photo.next': 'Sonraki',
  'p.photo.noTags': 'Etiket yok', 'p.photo.updated': 'Fotoğraf güncellendi', 'p.photo.deleteQ': 'Fotoğraf silinsin mi?', 'p.photo.irreversible': 'Bu işlem geri alınamaz.',
  'p.photo.deleted': 'Fotoğraf silindi', 'p.cmp.share': 'Paylaş', 'p.cmp.side': 'Yan yana', 'p.cmp.slide': 'Kaydır', 'p.cmp.overlay': 'Üst üste',
  'p.cmp.change': 'Değiştir', 'p.cmp.opacity': 'Opaklık', 'p.cmp.pickAfter': 'Sonrası fotoğrafını seç', 'p.cmp.noAfter': 'Seçilebilecek sonrası fotoğrafı yok',
  'p.cmp.file': 'karsilastirma.jpg', 'p.cmp.title': 'Karşılaştırma', 'p.cmp.downloaded': 'Görsel indirildi', 'p.cmp.shareFail': 'Paylaşım hazırlanamadı',
  // Ayarlar
  's.title': 'Ayarlar', 's.sub': 'Veriler yalnızca bu cihazda saklanır', 's.appearance': 'Görünüm', 's.language': 'Dil', 's.security': 'Güvenlik',
  's.theme.light': 'Açık', 's.theme.dark': 'Koyu', 's.theme.system': 'Sistem',
  's.pin': 'PIN kilidi', 's.pin.on': 'Açık', 's.pin.off': 'Kapalı', 's.pin.locksImmediately': 'Arka planda hemen kilitlenir', 's.pin.locksAfter': '{d} sonra kilitlenir',
  's.pin.enabled': 'PIN kilidi açıldı', 's.pin.change': 'PIN\'i değiştir', 's.pin.delay': 'Kilitleme süresi · {d}', 's.pin.remove': 'PIN kilidini kaldır',
  's.pin.changed': 'PIN değiştirildi', 's.pin.delayTitle': 'Arka plana alındıktan sonra kilitle', 's.pin.removed': 'PIN kilidi kaldırıldı',
  's.backup': 'Yedekleme', 's.backup.take': 'Yedek al', 's.backup.restore': 'Yedeği geri yükle', 's.backup.shared': 'Yedek paylaşıldı', 's.backup.downloaded': 'Yedek indirildi · {size}',
  's.backup.fail': 'Yedek alınamadı: {e}', 's.restore.fail': 'Geri yükleme başarısız',
  's.storage': 'Depolama', 's.mode.inApp': 'Uygulama içi tarayıcı', 's.mode.standalone': 'Ana ekran uygulaması', 's.mode.tab': 'Tarayıcı sekmesi',
  's.mode.inAppSub': 'Veriler kalıcı olmayabilir. Safari veya Chrome ile açıp ana ekrana ekle.', 's.mode.iosSub': 'Safari 7 gün kullanılmayan site verilerini silebilir. Ana ekrana ekle.',
  's.persist.on': 'Kalıcı depolama açık', 's.persist.off': 'Kalıcı depolama kapalı', 's.persist': 'Kalıcı depolama', 's.persist.tap': 'Dokunarak iste',
  's.persist.granted': 'Kalıcı depolama açıldı', 's.persist.denied': 'Tarayıcı kalıcı depolamaya izin vermedi',
  's.usage': 'Kullanılan alan', 's.records': 'Kayıtlar', 's.records.line': (p) => `${p.patients} hasta · ${p.procedures} işlem · ${p.photos} fotoğraf · ${p.appointments} randevu`,
  's.data': 'Veri', 's.clear': 'Tüm verileri sil', 's.clearQ': 'Tüm veriler silinsin mi?',
  's.clearMsg': (p) => `${p.patients} hasta, ${p.photos} fotoğraf ve tüm randevular kalıcı olarak silinecek. Bu işlem geri alınamaz.`, 's.clearOk': 'Hepsini sil', 's.cleared': 'Tüm veriler silindi',
  's.version': 'Hasta Takip · sürüm {v}',
  // Kilit
  'lock.now': 'Hemen', 'lock.min': (p) => `${p.n} dakika`, 'lock.forgot': 'PIN\'i unuttum',
  'lock.tooMany': 'Çok fazla deneme. {s} saniye bekleyin.', 'lock.verifyFail': 'Doğrulama yapılamadı', 'lock.wrong': 'Yanlış PIN', 'lock.wrongWait': 'Yanlış PIN. {d} bekleyin.',
  'lock.sec30': '30 saniye', 'lock.min5': '5 dakika',
  'lock.forgotText': 'PIN yalnızca bu cihazda saklanır ve kurtarılamaz. Sıfırlamanın tek yolu tüm hasta verilerini silmektir. Yedeğin varsa sonra geri yükleyebilirsin.',
  'lock.wipe': 'Tüm verileri sil ve PIN\'i kaldır', 'lock.wiped': 'Tüm veriler silindi, PIN kaldırıldı', 'lock.enter': 'Devam etmek için PIN girin',
  'lock.needsHttps': 'PIN için güvenli bağlantı (https) gerekir', 'lock.new': 'Yeni PIN', 'lock.newSub': '4 haneli bir PIN belirle', 'lock.confirm': 'PIN\'i doğrulayın',
  'lock.confirmSub': 'Aynı PIN\'i bir kez daha girin', 'lock.mismatch': 'PIN\'ler eşleşmedi, tekrar deneyin', 'lock.current': 'Mevcut PIN', 'lock.currentSub': 'Devam etmek için mevcut PIN\'i girin',
  // Depolama / yedek
  'n.inApp.title': 'Veriler burada kalıcı olmayabilir',
  'n.inApp.text': 'Sayfa bir uygulama içi tarayıcıda (mesajlaşma uygulaması vb.) açıldı; bu tarayıcılar kapanınca verileri silebilir. Bağlantıyı Safari veya Chrome ile açın ve ana ekrana ekleyin.',
  'n.ios.title': 'Ana ekrana ekleyin',
  'n.ios.text': 'Safari, 7 gün açılmayan sitelerin verilerini silebilir. Paylaş → Ana Ekrana Ekle ile kurup uygulamayı oradan açın. Ana ekrandaki uygulamanın verileri Safari\'dekinden ayrıdır; mevcut verileri Ayarlar → Yedek al ile taşıyın.',
  'n.mobile.title': 'Ana ekrana ekleyin', 'n.mobile.text': 'Tarayıcı menüsünden "Ana ekrana ekle" ile kurarsanız uygulama gibi açılır ve verileriniz korunur.',
  'b.fileName': 'hasta-takip-yedek', 'b.shareTitle': 'Hasta Takip yedeği', 'b.unreadable': 'Dosya okunamadı; geçerli bir yedek dosyası değil.', 'b.notBackup': 'Bu dosya bir Hasta Takip yedeği değil.',
  'b.restoreTitle': 'Yedeği geri yükle', 'b.datedBackup': '{when} tarihli yedek: ', 'b.backup': 'Yedek: ',
  'b.contents': (p) => `<b>${p.patients} hasta</b>, ${p.photos} fotoğraf, ${p.appointments} randevu.`,
  'b.modes': '<b>Birleştir</b> mevcut kayıtları korur, aynı kayıtları günceller. <b>Değiştir</b> önce mevcut tüm verileri siler.',
  'b.replace': 'Değiştir', 'b.merge': 'Birleştir', 'b.restored': '{n} hasta geri yüklendi',
};

const EN = {
  'app.name': 'Hasta Takip',
  'nav.patients': 'Patients', 'nav.calendar': 'Agenda', 'nav.settings': 'Settings', 'nav.foot': 'Data stays on this device.',
  'common.back': 'Back', 'common.cancel': 'Cancel', 'common.close': 'Close', 'common.save': 'Save', 'common.delete': 'Delete', 'common.edit': 'Edit',
  'common.more': 'More', 'common.ok': 'OK', 'common.yes': 'Yes', 'common.sure': 'Are you sure?', 'common.all': 'All', 'common.optional': '· optional',
  'common.selected': '· {n} selected', 'common.updated': 'Updated', 'common.deleted': 'Deleted', 'common.unnamed': 'Unnamed', 'common.remove': 'Remove',
  'common.today': 'Today', 'common.tomorrow': 'Tomorrow', 'common.yesterday': 'Yesterday',
  'common.error': 'Something went wrong', 'common.home': 'Go to home', 'common.dbFail': 'Could not open the database', 'common.newVersion': 'New version ready, reload the page',
  'common.saveFail': 'Could not save', 'common.imgFail': 'Could not read the image',
  'db.blocked': 'The database is open in another tab.', 'db.aborted': 'Transaction aborted', 'db.badBackup': 'Invalid backup file.',
  'age': '{n} yrs',
  'rel.after': (p) => `in ${p.n} ${p.u}`, 'rel.before': (p) => `${p.n} ${p.u} ago`,
  'unit.day': 'days', 'unit.week': 'weeks', 'unit.month': 'months', 'unit.year': 'years',
  'unit1.day': 'day', 'unit1.week': 'week', 'unit1.month': 'month', 'unit1.year': 'year',
  'since.pre': 'before surgery', 'since.day0': 'surgery day', 'since.nth': (p) => `${p.u} ${p.n}`,
  'days.n': (p) => pl(p.n, 'day', 'days'), 'days.late': (p) => `${pl(p.n, 'day', 'days')} late`,
  'status.late': 'Overdue', 'status.planned': 'Planned', 'status.done': 'Done', 'status.missed': 'No-show', 'status.cancelled': 'Cancelled',
  'gender.F': 'Female', 'gender.M': 'Male', 'gender.none': 'Unspecified',
  'phase.before': 'Before', 'phase.after': 'After',
  'kind.kontrol': 'Follow-up', 'kind.muayene': 'Consultation', 'kind.operasyon': 'Surgery', 'kind.pansuman': 'Dressing', 'kind.diger': 'Other', 'kind.default': 'Appointment',
  'sched.d1': 'Day 1 Follow-up', 'sched.w1': 'Week 1 Follow-up', 'sched.m1': 'Month 1 Follow-up', 'sched.m3': 'Month 3 Follow-up', 'sched.m6': 'Month 6 Follow-up', 'sched.y1': 'Year 1 Follow-up',
  'sched.short.d1': 'day 1', 'sched.short.w1': 'week 1', 'sched.short.m1': 'month 1', 'sched.short.m3': 'month 3', 'sched.short.m6': 'month 6', 'sched.short.y1': 'year 1',
  'anest.Genel': 'General', 'anest.Lokal': 'Local', 'anest.Sedasyon': 'Sedation', 'anest.Lokal + Sedasyon': 'Local + Sedation', 'anest.Yok': 'None',
  'anest.line': '{a} anaesthesia',
  'form.patient.new': 'New patient', 'form.patient.edit': 'Edit patient', 'form.patient.save': 'Save patient',
  'form.firstName': 'First name', 'form.lastName': 'Last name', 'form.phone': 'Phone', 'form.phone.ph': '+90 5xx xxx xx xx', 'form.birthDate': 'Date of birth',
  'form.gender': 'Sex', 'form.bloodType': 'Blood type', 'form.bloodType.unknown': 'Unknown', 'form.email': 'Email',
  'form.allergies': 'Allergies', 'form.allergies.ph': 'Penicillin, latex…', 'form.referral': 'Referred by', 'form.referral.ph': 'Recommendation, social media, physician…',
  'form.notes': 'Notes', 'form.notes.ph': 'Systemic conditions, medications, smoking, expectations…', 'form.nameRequired': 'First and last name are required.',
  'form.proc.new': 'New procedure', 'form.proc.edit': 'Edit procedure', 'form.proc.save': 'Save procedure', 'form.proc.type': 'Procedure type',
  'form.proc.title': 'Description / technique', 'form.proc.title.ph': 'Open technique, cartilage graft…', 'form.proc.date': 'Procedure date', 'form.proc.anesthesia': 'Anaesthesia',
  'form.proc.notes': 'Operative note', 'form.proc.notes.ph': 'Findings, technique, complications, recommendations…', 'form.proc.controls': 'Follow-up schedule',
  'form.proc.controlTime': 'Follow-up time', 'form.proc.controlsHint': 'Selected periods are added as appointments based on the procedure date; those falling on Sunday move to Monday.',
  'form.proc.typeRequired': 'Choose a procedure type.', 'form.proc.dateRequired': 'Procedure date is required.',
  'form.appt.new': 'New appointment', 'form.appt.edit': 'Edit appointment', 'form.appt.save': 'Save appointment', 'form.appt.date': 'Date', 'form.appt.time': 'Time',
  'form.appt.kind': 'Type', 'form.appt.status': 'Status', 'form.appt.label': 'Title', 'form.appt.label.ph': 'Suture removal, dressing, week 2 follow-up…',
  'form.appt.proc': 'Linked procedure', 'form.appt.noProc': 'No linked procedure', 'form.appt.note': 'Note', 'form.appt.required': 'Date and time are required.',
  'form.photo.title': 'Add photos', 'form.photo.save': 'Add photos', 'form.photo.pick': 'Choose from gallery',
  'form.photo.pickHint': 'You can select several photos. A downsized copy is stored; the original stays on your device.',
  'form.photo.phase': 'Stage', 'form.photo.date': 'Date taken', 'form.photo.tags': 'Tags', 'form.photo.tags.ph': 'Profile, Front, Basal… (comma separated)', 'form.photo.tags.ph2': 'Profile, Front, Basal…',
  'form.photo.picked': (p) => `${pl(p.n, 'photo', 'photos')} selected · add more`,
  'form.photo.exifMany': 'The photos were taken on different dates; each is saved with its own date.',
  'form.photo.exifAll': 'Date taken was read from the photo.',
  'form.photo.exifSome': 'Date taken was read from the photo; photos without date info use this date.',
  'form.photo.exifManual': 'All photos will be saved with the date you chose.',
  'form.photo.none': 'Select at least one photo.', 'form.photo.processing': 'Processing {i}/{n}',
  'form.photo.saveFail': (p) => `Could not save "${p.name}": ${p.err}.${p.done ? ` ${pl(p.done, 'photo', 'photos')} saved.` : ''}`,
  'form.photo.added': (p) => `${pl(p.n, 'photo', 'photos')} added`, 'form.photo.info': 'Photo details',
  'patients.title': 'Patients', 'patients.count': (p) => pl(p.n, 'record', 'records'), 'patients.upcoming': (p) => `${pl(p.n, 'upcoming follow-up', 'upcoming follow-ups')}`, 'patients.new': 'New patient',
  'patients.search.ph': 'Name or phone', 'patients.search': 'Search patients', 'patients.added': 'Patient added', 'patients.noProc': 'No procedures yet',
  'patients.empty': 'No patients yet', 'patients.emptyText': 'Start by creating the first patient record.', 'patients.noResult': 'No results',
  'patients.noMatch': 'No patient matches "{q}".', 'patients.upcomingLabel': 'Upcoming follow-up', 'patients.results': (p) => pl(p.n, 'result', 'results'), 'patients.all': 'All patients',
  'cal.title': 'Agenda', 'cal.todayCount': (p) => `${pl(p.n, 'appointment', 'appointments')} today`, 'cal.list': 'List', 'cal.month': 'Calendar', 'cal.overdue': 'Overdue · {n}',
  'cal.upcoming': 'Upcoming follow-up', 'cal.emptyList': 'No appointments in the next {n} days', 'cal.emptyListText': 'Follow-ups appear here when you add a procedure.',
  'cal.later': (p) => `${pl(p.n, 'more planned appointment', 'more planned appointments')} after ${p.days} days.`, 'cal.count': (p) => pl(p.n, 'appointment', 'appointments'), 'cal.prev': 'Previous month', 'cal.next': 'Next month',
  'cal.weekdays': () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 'cal.add': 'Add appointment', 'cal.noneDay': 'No appointments on this day.', 'cal.noneMonth': 'No appointments this month.',
  'cal.addPatientFirst': 'Add a patient first', 'cal.whichPatient': 'Which patient?', 'cal.added': 'Appointment added', 'cal.openPatient': 'Open patient record',
  'cal.deletedPatient': 'Deleted patient',
  'appt.markDone': 'Mark as done', 'appt.markMissed': 'No-show', 'appt.markPlanned': 'Set as planned', 'appt.editDate': 'Edit / reschedule',
  'appt.openProc': 'Open procedure · {p}', 'appt.delete': 'Delete appointment', 'appt.deleteQ': 'Delete this appointment?', 'appt.deleted': 'Appointment deleted', 'appt.updated': 'Appointment updated',
  'appt.doneToast': 'Marked as done', 'appt.missedToast': 'Marked as no-show', 'appt.plannedToast': 'Set as planned',
  'p.title': 'Patient', 'p.notFound': 'Patient not found', 'p.notFoundText': 'The record may have been deleted.', 'p.backToList': 'Back to patients',
  'p.updated': 'Patient details updated', 'p.editInfo': 'Edit details', 'p.addPhoto': 'Add photo', 'p.addAppt': 'Add appointment', 'p.delete': 'Delete patient',
  'p.deleteQ': 'Delete this patient?', 'p.deleteMsg': (p) => `${p.name} will be permanently deleted along with ${pl(p.procs, 'procedure', 'procedures')}, ${pl(p.photos, 'photo', 'photos')} and ${pl(p.appts, 'appointment', 'appointments')}.`,
  'p.deleted': 'Patient deleted', 'p.procAdded': 'Procedure added', 'p.procAddedControls': (p) => `Procedure added · ${pl(p.n, 'follow-up', 'follow-ups')} scheduled`, 'p.apptAdded': 'Appointment added',
  'p.call': 'Call', 'p.addProc': 'Add procedure', 'p.noProc': 'No procedures yet', 'p.noInfo': 'No details yet',
  'p.stat.procs': 'procedures', 'p.stat.photos': 'photos', 'p.stat.noControl': 'No planned follow-up',
  'p.tab.general': 'General', 'p.tab.procs': 'Procedures', 'p.tab.photos': 'Photos', 'p.tab.appts': 'Appointments',
  'p.allergy': 'Allergy', 'p.overdueAlert': (p) => `${pl(p.n, 'overdue follow-up', 'overdue follow-ups')} · ${p.list}`, 'p.registered': 'Registered',
  'p.recentPhotos': 'Recent photos', 'p.noPhotos': 'No photos yet', 'p.noPhotosText': 'Add the first "before" photo.', 'p.upcomingControls': 'Upcoming follow-ups',
  'p.controls': (p) => `${p.done}/${p.n} follow-ups`, 'p.photosN': (p) => pl(p.n, 'photo', 'photos'),
  'p.noProcText': 'When you add a procedure, day 1, week 1, month 1, month 3, month 6 and year 1 follow-ups are scheduled automatically.',
  'p.proc.date': 'Date', 'p.proc.since': 'Time since', 'p.proc.anesthesia': 'Anaesthesia', 'p.proc.technique': 'Technique', 'p.proc.photo': 'Photos',
  'p.proc.photoLine': (p) => `${p.n} · ${p.before} before, ${p.after} after`, 'p.proc.note': 'Operative note', 'p.proc.controls': 'Follow-up schedule',
  'p.proc.doneOf': '{done}/{n} done', 'p.proc.noControls': 'No follow-up schedule for this procedure.', 'p.proc.makeControls': 'Create follow-up schedule',
  'p.proc.otherAppts': 'Other appointments', 'p.proc.updated': 'Procedure updated', 'p.proc.controlsMade': 'Follow-up schedule created',
  'p.proc.regen': 'Rebuild follow-up schedule', 'p.proc.delete': 'Delete procedure', 'p.proc.regenQ': 'Rebuild follow-ups?',
  'p.proc.regenMsg': 'Automatic follow-ups linked to this procedure will be deleted and rescheduled from the procedure date. Their statuses will be lost.', 'p.proc.regenOk': 'Rebuild',
  'p.proc.regenerated': 'Follow-up schedule rebuilt', 'p.proc.deleteQ': 'Delete this procedure?',
  'p.proc.deleteMsg': (p) => `The ${p.type} record and ${pl(p.n, 'automatic follow-up', 'automatic follow-ups')} will be deleted. Photos are kept.`, 'p.proc.deleted': 'Procedure deleted',
  'p.appt.overdue': 'Overdue', 'p.appt.upcoming': 'Upcoming', 'p.appt.past': 'Past', 'p.appt.empty': 'No appointments',
  'p.appt.emptyText': 'Follow-ups are created automatically when you add a procedure. You can also add free appointments.',
  'p.photo.unlinked': 'Not linked to a procedure', 'p.photo.noMatch': 'No photos match this filter', 'p.photo.show': 'Show', 'p.photo.compare': 'Compare',
  'p.photo.pickBefore': 'Pick a before', 'p.photo.pickAfter': 'pick an after', 'p.photo.viewer': 'Photo', 'p.photo.prev': 'Previous', 'p.photo.next': 'Next',
  'p.photo.noTags': 'No tags', 'p.photo.updated': 'Photo updated', 'p.photo.deleteQ': 'Delete this photo?', 'p.photo.irreversible': 'This cannot be undone.',
  'p.photo.deleted': 'Photo deleted', 'p.cmp.share': 'Share', 'p.cmp.side': 'Side by side', 'p.cmp.slide': 'Slider', 'p.cmp.overlay': 'Overlay',
  'p.cmp.change': 'Change', 'p.cmp.opacity': 'Opacity', 'p.cmp.pickAfter': 'Choose the after photo', 'p.cmp.noAfter': 'No after photo to choose from',
  'p.cmp.file': 'comparison.jpg', 'p.cmp.title': 'Comparison', 'p.cmp.downloaded': 'Image downloaded', 'p.cmp.shareFail': 'Could not prepare the share',
  's.title': 'Settings', 's.sub': 'Data is stored only on this device', 's.appearance': 'Appearance', 's.language': 'Language', 's.security': 'Security',
  's.theme.light': 'Light', 's.theme.dark': 'Dark', 's.theme.system': 'System',
  's.pin': 'PIN lock', 's.pin.on': 'On', 's.pin.off': 'Off', 's.pin.locksImmediately': 'Locks immediately in background', 's.pin.locksAfter': 'Locks after {d}',
  's.pin.enabled': 'PIN lock enabled', 's.pin.change': 'Change PIN', 's.pin.delay': 'Lock delay · {d}', 's.pin.remove': 'Remove PIN lock',
  's.pin.changed': 'PIN changed', 's.pin.delayTitle': 'Lock after going to background', 's.pin.removed': 'PIN lock removed',
  's.backup': 'Backup', 's.backup.take': 'Back up', 's.backup.restore': 'Restore backup', 's.backup.shared': 'Backup shared', 's.backup.downloaded': 'Backup downloaded · {size}',
  's.backup.fail': 'Backup failed: {e}', 's.restore.fail': 'Restore failed',
  's.storage': 'Storage', 's.mode.inApp': 'In-app browser', 's.mode.standalone': 'Home screen app', 's.mode.tab': 'Browser tab',
  's.mode.inAppSub': 'Data may not persist. Open in Safari or Chrome and add to the home screen.', 's.mode.iosSub': 'Safari may delete site data unused for 7 days. Add to the home screen.',
  's.persist.on': 'Persistent storage on', 's.persist.off': 'Persistent storage off', 's.persist': 'Persistent storage', 's.persist.tap': 'Tap to request',
  's.persist.granted': 'Persistent storage enabled', 's.persist.denied': 'The browser did not allow persistent storage',
  's.usage': 'Space used', 's.records': 'Records', 's.records.line': (p) => `${pl(p.patients, 'patient', 'patients')} · ${pl(p.procedures, 'procedure', 'procedures')} · ${pl(p.photos, 'photo', 'photos')} · ${pl(p.appointments, 'appointment', 'appointments')}`,
  's.data': 'Data', 's.clear': 'Delete all data', 's.clearQ': 'Delete all data?',
  's.clearMsg': (p) => `${pl(p.patients, 'patient', 'patients')}, ${pl(p.photos, 'photo', 'photos')} and all appointments will be permanently deleted. This cannot be undone.`, 's.clearOk': 'Delete everything', 's.cleared': 'All data deleted',
  's.version': 'Hasta Takip · version {v}',
  'lock.now': 'Immediately', 'lock.min': (p) => pl(p.n, 'minute', 'minutes'), 'lock.forgot': 'Forgot PIN',
  'lock.tooMany': 'Too many attempts. Wait {s} seconds.', 'lock.verifyFail': 'Could not verify', 'lock.wrong': 'Wrong PIN', 'lock.wrongWait': 'Wrong PIN. Wait {d}.',
  'lock.sec30': '30 seconds', 'lock.min5': '5 minutes',
  'lock.forgotText': 'The PIN is stored only on this device and cannot be recovered. The only way to reset it is to delete all patient data. If you have a backup you can restore it afterwards.',
  'lock.wipe': 'Delete all data and remove PIN', 'lock.wiped': 'All data deleted, PIN removed', 'lock.enter': 'Enter your PIN to continue',
  'lock.needsHttps': 'PIN requires a secure connection (https)', 'lock.new': 'New PIN', 'lock.newSub': 'Choose a 4-digit PIN', 'lock.confirm': 'Confirm PIN',
  'lock.confirmSub': 'Enter the same PIN once more', 'lock.mismatch': 'PINs do not match, try again', 'lock.current': 'Current PIN', 'lock.currentSub': 'Enter your current PIN to continue',
  'n.inApp.title': 'Data may not persist here',
  'n.inApp.text': 'This page opened in an in-app browser (messaging app etc.); such browsers can wipe data when closed. Open the link in Safari or Chrome and add it to the home screen.',
  'n.ios.title': 'Add to home screen',
  'n.ios.text': 'Safari may delete data of sites not opened for 7 days. Install with Share → Add to Home Screen and open the app from there. The home screen app keeps separate data from Safari; move existing data with Settings → Back up.',
  'n.mobile.title': 'Add to home screen', 'n.mobile.text': 'Install via the browser menu "Add to home screen" so it opens like an app and your data is protected.',
  'b.fileName': 'hasta-takip-backup', 'b.shareTitle': 'Hasta Takip backup', 'b.unreadable': 'Could not read the file; not a valid backup.', 'b.notBackup': 'This file is not a Hasta Takip backup.',
  'b.restoreTitle': 'Restore backup', 'b.datedBackup': 'Backup from {when}: ', 'b.backup': 'Backup: ',
  'b.contents': (p) => `<b>${pl(p.patients, 'patient', 'patients')}</b>, ${pl(p.photos, 'photo', 'photos')}, ${pl(p.appointments, 'appointment', 'appointments')}.`,
  'b.modes': '<b>Merge</b> keeps existing records and updates matching ones. <b>Replace</b> deletes all existing data first.',
  'b.replace': 'Replace', 'b.merge': 'Merge', 'b.restored': (p) => `${pl(p.n, 'patient', 'patients')} restored`,
};

const DICT = { tr: TR, en: EN };

/** Çeviri: t('key') ya da t('key', { n: 3 }) — anahtar yoksa Türkçe, o da yoksa anahtarın kendisi */
export function t(key, params) {
  const v = DICT[getLang()][key] ?? TR[key] ?? key;
  if (typeof v === 'function') return v(params || {});
  return params ? v.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? '')) : v;
}

/* ---------------- Kayıtlı veri etiketleri ---------------- */
// İşlem türleri: kayıtlı değer Türkçe; İngilizce görünüm için karşılık
const PROC_EN = {
  'Rinoplasti': 'Rhinoplasty', 'Revizyon Rinoplasti': 'Revision Rhinoplasty', 'Septorinoplasti': 'Septorhinoplasty', 'Blefaroplasti': 'Blepharoplasty',
  'Yüz Germe': 'Facelift', 'Boyun Germe': 'Neck Lift', 'Kaş Kaldırma': 'Brow Lift', 'Otoplasti': 'Otoplasty', 'Meme Büyütme': 'Breast Augmentation',
  'Meme Küçültme': 'Breast Reduction', 'Meme Dikleştirme': 'Breast Lift', 'Jinekomasti': 'Gynecomastia', 'Liposuction': 'Liposuction',
  'Abdominoplasti': 'Abdominoplasty', 'Brazilian Butt Lift': 'Brazilian Butt Lift', 'Kol Germe': 'Arm Lift', 'Uyluk Germe': 'Thigh Lift',
  'Yağ Enjeksiyonu': 'Fat Grafting', 'Dolgu': 'Filler', 'Botoks': 'Botox', 'Saç Ekimi': 'Hair Transplant', 'Skar Revizyonu': 'Scar Revision', 'Diğer': 'Other',
};
export const PROC_KEYS = Object.keys(PROC_EN);
export function procLabel(type) { return getLang() === 'en' ? (PROC_EN[type] || type || '') : (type || ''); }
export function anesthesiaLabel(a) { return a ? t(`anest.${a}`) : ''; }
export function kindLabel(kind) { const k = `kind.${kind}`; return TR[k] ? t(k) : (kind || ''); }

// Randevu başlığı: bilinen kontrol/tür adları (her iki dilde) çevrilir, serbest metin olduğu gibi kalır
const KNOWN_LABELS = {};
for (const dict of [TR, EN]) for (const k of Object.keys(dict)) if ((k.startsWith('sched.') && !k.startsWith('sched.short.')) || k.startsWith('kind.')) KNOWN_LABELS[dict[k]] = k;
export function apptLabel(a) {
  if (a.scheduleKey && TR[`sched.${a.scheduleKey}`]) return t(`sched.${a.scheduleKey}`);
  const k = KNOWN_LABELS[a.label];
  if (k) return t(k);
  return a.label || kindLabel(a.kind) || t('kind.default');
}

/** index.html'deki sabit metinler: [data-i18n] içerik, [data-i18n-aria] aria-label */
export function applyStaticText(root = document) {
  document.documentElement.lang = getLang();
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
