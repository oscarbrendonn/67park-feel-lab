# 67Park: önce temel oyuncu deneyimi

Yeni mini oyun, pet veya ödül içeriğinden önce bu liste tamamlanmalı. Ayar ekranının iyi çalışması, online temelin tamamlandığı anlamına gelmez. Çalışma alanı yalnızca **67park-feel-lab**; eski desktop/mobil repoları bu değişiklikte korunur.

## 1. Giriş ve profil

- Var: karakter seçimi → aynı sayfada stüdyo → park; sonraki ziyarette kayıtlı karakter; profil düğmesinden stüdyo.
- Var: gerçek yükleme ilerlemesi, gecikme/hata durumunda tekrar deneme. Ayarlar seçim ekranında gizli.
- Henüz yok: cihazlar arası geri getirilebilir kalıcı hesap ve doğrulanmış sunucu kaydı. Misafir kimliği IP adresi değildir; browser kaydı hesap değildir.
- Kabul: yenileme/geri dönüş/bozuk kayıt/dosya hatası karakteri silmemeli, sonsuz boş ekran bırakmamalı. Kayıtlı kıyafet ve tercihleri korumalı.

## 2. Kontroller, ses ve yardım

- Var: mouse/dokunma hassasiyeti, mobil/desktop tuş boyutu, efekt/ortam sesi, isim/chat görünürlüğü, kontrol yardımı, sıfırlama onayı.
- Bu sürüm: ayar kaydının başarı/hata durumu ve yeniden deneme; I: çanta kısayolu yardımda tamamlandı.
- Bu sürüm: rapor sürümü, cihaz boyutu, iki bağlantının durumu, karakter hazır olma durumu, yalnızca hata sayısı. Oturum anahtarı, davet kodu, isim ve sohbet alınmaz. Rapor otomatik gönderilmez.
- Bu sürüm: kopyalama izni yoksa kullanıcının açıklaması da manuel kopyalanabilen tam raporda kalır. İndirilemeyen rapor için alternatif sunulur.
- Kabul: panel, klavye ve telefon klavyesi oyunun çizimini durdurmamalı; kapatınca basılı tuş kalmamalı; varsayılana dönmek karakteri/kıyafeti/kimliği silmemeli.

## 3. Sosyal güvenlik — genel yayından önce

- Eksik: oyuncu bazında engelleme/susturma, şikâyet akışı ve bu şikâyetleri değerlendirecek yönetim süreci. Chat'i gizlemek bunların yerine geçmez.
- Tamamlanmalı: davet/arkadaş isteği tercihleri, isim ve chat doğrulaması, spam sınırları; çocukların kişisel bilgi paylaşmasını teşvik etmeyen giriş.
- Hukuki/yaş/gizlilik akışı ürünün hedef ülkeleri ve hesap modeli netleşince ayrıca doğrulanmalı; bu sürümde bir uyumluluk iddiası yok.

## 4. Online devamlılık — en büyük teknik öncelik

- Bu sürüm: ayarlarda park ve Play & friends bağlantıları ayrı kontrol edilir; kısmi bağlantı, internet kesintisi ve başka sekmede açık oturum yanlışlıkla “bağlı” gösterilmez. Yeni bağlantı oluşturulmaz.
- Düzeltilen bilgi: test sunucusu yeniden başlayınca arkadaşların kalacağı garanti edilmiyordu; arayüzdeki yanlış garanti kaldırıldı.
- Hâlâ eksik: lobi/ev/mini oyun arasında tek kimlik ve grup devamlılığı, uzun kesintide aynı lobiye dönüş, oda doluluğu ve çift sekme kurtarma; sunucu yeniden başlarken kalıcı veri.
- Hâlâ eksik: her maçın hata izolasyonu, tek ve sürümlenmiş dağıtılabilir backend. Bir maçtaki hata diğer odaları durdurmamalı.
- Kabul: 100 tekrarlı sahne geçişi; 1/5/15/30 saniyelik kopmalar; uygulamayı arka plana alma; yenileme; arkadaş/ev/maç akışları; hata enjeksiyonu. Eski sınırlı testler bunların tamamını kanıtlamaz.

## 5. Çıkış, kurtarma ve performans

- Açık hale getirilmeli: maçtan ayrılma/arkadaş grubuna dönüş; takılı kalınca güvenli kurtarma. Yarışta sonuçları veya ev erişimini atlayan kontrolsüz bir teleport yapılmamalı.
- Gerçek düşük/orta Android, iPhone Safari ve desktop uzun süre test edilmeden “tüm cihazlar” veya “100 karakter sorunsuz” denmez.
- Önce ölçülen lobi kapasitesi korunur. Otomatik grafik seviyesi ancak gerçek cihaz ölçümleriyle; süs olsun diye çalışmayan grafik anahtarları eklenmez.

## Sıradaki iş sırası

1. Bu sürümün küçük temel akışlarının desktop ve mobil görünüm testi.
2. Tek online oturum/oda devamlılığı ve kalıcı profil altyapısı; yeniden bağlanma/yeniden başlama testleri.
3. Engelleme/şikâyet/davet tercihleri ve yönetim süreci.
4. Gerçek cihaz, dolu lobi ve uzun oturum kabul testleri.
5. Ancak bundan sonra kazanan kutlaması, galibiyet sayısı ve kozmetik/katılım puanları; yeni içerik.

## Bu sürümün doğrulaması

- `qa/player-basics.test.mjs`, `qa/returning-entry.test.mjs`, `qa/skate-audio.test.mjs`, `qa/studio-catalog.test.mjs`, `qa/pets.test.mjs`, `qa/render-health.test.mjs`: 29 kontrol geçti.
- `qa/player-basics.browser.cjs`: izole yerel sunucuda desktop 1280×900 ve Chrome mobil emülasyonu 390×844; ilk giriş, stüdyo, yenileme, kalıcı ayarlar, sıfırlamayı iptal/onay, kota hatası ve kurtarma, manuel rapor kopyalama/indirme, 100 kez panel aç/kapat, yeni soket yaratmama, çizimin devam etmesi, kısa kopma sırasında dışarıdaki oyuncunun bağlı kalması.
- Bu, fiziksel iPhone/Android, uzun kopma, sunucu yeniden başlatma veya 100 render edilen karakter testi değildir. Genel yayına uygunluk onayı verilmez.

## Rögar yerleşimi ve ek doğrulama — hatch-ends-1

- İki kapak başlangıç/yol ortasından, ölçülmüş doğu yol sonu kaldırım cebine (245, 130) ve kuzey çıkmaz yol kenarına (158, -234) taşındı. Trambolinler yerinde. Su/ağaç/eğim veya yol uzaması yüzünden nokta güvenli olmazsa kapak yol ortasında alternatif aramak yerine atlanır.
- `qa/launcher-placement.test.mjs`: 4 yerleşim/zemin koruma testi. İlgili ayar, yükleme, oda, lobi, çizim sağlığı ve kaykay sesi testleriyle toplam **34 test geçti**.
- `qa/launcher-placement.browser.cjs`: izole yerel sunucuda desktop ve mobil emülasyonu; 4 platformun her biri gerçekten oyuncuyu havaya kaldırdı, çizim devam etti, takip edilen kaynak sayıları artmadı, yakalanmış sayfa/oyun hatası yoktu.
- `qa/entry-recovery.browser.cjs`: ana harita GLB isteğine bilinçli 503 yanıtı; hata ekranı göründü, kayıtlı karakter korundu, ayarlar girişte gizli kaldı, Retry loading sonrası harita/karakter/online bağlantı yeniden hazır oldu. Desktop ve mobil emülasyonu geçti.
- `qa/action-stability.cjs`: iki görünümde ev giriş/çıkışı (20 geçiş), 100 klavye punch, 1.000 punch tıklaması, 1.000 interact komutu, chat sonrası hareket; mobilde ayrıca 100 gerçek dokunma olayı. Kalıcı render durması, WebGL context kaybı veya yakalanmış oyun hatası görülmedi. **İlk kapı açılışında desktop yaklaşık 717 ms, mobil emülasyonu 300 ms azami kare aralığı ölçüldü; bu kısa takılmalar açık performans bulgusudur.**
- Bunlar fiziksel cihaz veya kalabalık lobi sertifikasyonu değildir. Önceki auditte açık kalan uzun kopmada grup/lobi devamlılığı, mini oyun sosyal bağlantısı, odalar arası hata izolasyonu ve sunucu yeniden başlamasında kalıcı kimlik/arkadaş verisi bu sürümde düzeltilmedi. Yukarıdaki eksik sosyal güvenlik ve hesap başlıkları geçerlidir.
- Üç yeni fantastik pet yalnızca ayrı Blender konsept dosyalarıdır; ana oyuna eklenmedi, bu sürüm onları indirmez.
