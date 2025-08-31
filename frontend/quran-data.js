// Mock Quran data for facade functionality
const quranData = {
    suras: [
      {
        number: 1,
        name: "الفاتحة",
        nameTranslation: "Al-Fatiha (The Opening)",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
            transliteration: "Bismillahi'r-rahmani'r-raheem"
          },
          {
            number: 2,
            arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            translation: "Praise is due to Allah, Lord of the worlds.",
            transliteration: "Alhamdu lillahi rabbi'l-alameen"
          },
          {
            number: 3,
            arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
            translation: "The Entirely Merciful, the Especially Merciful,",
            transliteration: "Ar-rahmani'r-raheem"
          },
          {
            number: 4,
            arabic: "مَالِكِ يَوْمِ الدِّينِ",
            translation: "Sovereign of the Day of Recompense.",
            transliteration: "Maliki yawmi'd-deen"
          },
          {
            number: 5,
            arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            translation: "It is You we worship and You we ask for help.",
            transliteration: "Iyyaka na'budu wa iyyaka nasta'een"
          },
          {
            number: 6,
            arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
            translation: "Guide us to the straight path -",
            transliteration: "Ihdina's-sirata'l-mustaqeem"
          },
          {
            number: 7,
            arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
            translation: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
            transliteration: "Sirata'lladhina an'amta alayhim ghayri'l-maghdubi alayhim wa la'd-dalleen"
          }
        ]
      },
      {
        number: 2,
        name: "البقرة",
        nameTranslation: "Al-Baqarah (The Cow)",
        revelationType: "Medinan",
        ayahs: [
          {
            number: 1,
            arabic: "الم",
            translation: "Alif, Lam, Meem.",
            transliteration: "Alif-lam-meem"
          },
          {
            number: 2,
            arabic: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ",
            translation: "This is the Book about which there is no doubt, a guidance for those conscious of Allah -",
            transliteration: "Dhalika'l-kitabu la rayba feeh, hudan li'l-muttaqeen"
          },
          {
            number: 3,
            arabic: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ",
            translation: "Who believe in the unseen, establish prayer, and spend out of what We have provided for them,",
            transliteration: "Alladhina yu'minoona bil-ghaybi wa yuqeemoona as-salaata wa mimma razaqnaahum yunfiqoon"
          },
          {
            number: 255,
            arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۛ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
            translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep.",
            transliteration: "Allaahu laa ilaaha illaa huwa al-hayyu al-qayyoom, laa ta'khudhuhu sinatun wa laa nawm"
          }
        ]
      },
      {
        number: 3,
        name: "آل عمران",
        nameTranslation: "Aal-E-Imran (Family of Imran)",
        revelationType: "Medinan",
        ayahs: [
          {
            number: 1,
            arabic: "الم",
            translation: "Alif, Lam, Meem.",
            transliteration: "Alif-lam-meem"
          },
          {
            number: 2,
            arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
            translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.",
            transliteration: "Allaahu laa ilaaha illaa huwa al-hayyu al-qayyoom"
          },
          {
            number: 18,
            arabic: "شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ",
            translation: "Allah witnesses that there is no deity except Him, and [so do] the angels and those of knowledge -",
            transliteration: "Shahida Allaahu annahu laa ilaaha illaa huwa wa al-malaa'ikatu wa uloo al-'ilm"
          }
        ]
      },
      {
        number: 18,
        name: "الكهف",
        nameTranslation: "Al-Kahf (The Cave)",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا",
            translation: "[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.",
            transliteration: "Al-hamdu lillaahi alladhee anzala 'alaa 'abdihi al-kitaaba wa lam yaj'al lahu 'iwajaa"
          },
          {
            number: 10,
            arabic: "إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً",
            translation: "[Mention] when the youths retreated to the cave and said, 'Our Lord, grant us from Yourself mercy'",
            transliteration: "Idh awaa al-fityatu ilaa al-kahfi fa-qaaloo rabbanaa aatinaa min ladunka rahmatan"
          }
        ]
      },
      {
        number: 36,
        name: "يس",
        nameTranslation: "Ya-Sin",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "يس",
            translation: "Ya, Sin.",
            transliteration: "Yaa-seen"
          },
          {
            number: 2,
            arabic: "وَالْقُرْآنِ الْحَكِيمِ",
            translation: "By the wise Qur'an.",
            transliteration: "Wa al-qur'aani al-hakeem"
          },
          {
            number: 3,
            arabic: "إِنَّكَ لَمِنَ الْمُرْسَلِينَ",
            translation: "Indeed you, [O Muhammad], are from among the messengers,",
            transliteration: "Innaka la-mina al-mursaleen"
          }
        ]
      },
      {
        number: 55,
        name: "الرحمن",
        nameTranslation: "Ar-Rahman (The Beneficent)",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "الرَّحْمَٰنُ",
            translation: "The Most Merciful",
            transliteration: "Ar-Rahman"
          },
          {
            number: 2,
            arabic: "عَلَّمَ الْقُرْآنَ",
            translation: "Taught the Qur'an,",
            transliteration: "'Allama al-qur'aan"
          },
          {
            number: 3,
            arabic: "خَلَقَ الْإِنسَانَ",
            translation: "Created man,",
            transliteration: "Khalaqa al-insaan"
          },
          {
            number: 13,
            arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
            translation: "So which of the favors of your Lord would you deny?",
            transliteration: "Fa-bi-ayyi aalaa'i rabbikumaa tukadhdhibaan"
          }
        ]
      },
      {
        number: 112,
        name: "الإخلاص",
        nameTranslation: "Al-Ikhlas (The Sincerity)",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
            translation: "Say, 'He is Allah, [who is] One,",
            transliteration: "Qul huwa Allaahu ahad"
          },
          {
            number: 2,
            arabic: "اللَّهُ الصَّمَدُ",
            translation: "Allah, the Eternal Refuge.",
            transliteration: "Allaahu as-samad"
          },
          {
            number: 3,
            arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
            translation: "He neither begets nor is born,",
            transliteration: "Lam yalid wa lam yoolad"
          },
          {
            number: 4,
            arabic: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
            translation: "Nor is there to Him any equivalent.'",
            transliteration: "Wa lam yakun lahu kufuwan ahad"
          }
        ]
      },
      {
        number: 113,
        name: "الفلق",
        nameTranslation: "Al-Falaq (The Daybreak)",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
            translation: "Say, 'I seek refuge in the Lord of daybreak",
            transliteration: "Qul a'oodhu bi-rabbi al-falaq"
          },
          {
            number: 2,
            arabic: "مِن شَرِّ مَا خَلَقَ",
            translation: "From the evil of that which He created",
            transliteration: "Min sharri maa khalaq"
          }
        ]
      },
      {
        number: 114,
        name: "الناس",
        nameTranslation: "An-Nas (Mankind)",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
            translation: "Say, 'I seek refuge in the Lord of mankind,",
            transliteration: "Qul a'oodhu bi-rabbi an-naas"
          },
          {
            number: 2,
            arabic: "مَلِكِ النَّاسِ",
            translation: "The Sovereign of mankind,",
            transliteration: "Maliki an-naas"
          },
          {
            number: 3,
            arabic: "إِلَٰهِ النَّاسِ",
            translation: "The God of mankind,",
            transliteration: "Ilaahi an-naas"
          }
        ]
      }
    ],
    
    // Search function to find ayahs by keyword
    search: function(keyword) {
      const results = [];
      const searchTerm = keyword.toLowerCase();
      
      this.suras.forEach(sura => {
        sura.ayahs.forEach(ayah => {
          if (ayah.arabic.includes(searchTerm) || 
              ayah.translation.toLowerCase().includes(searchTerm) ||
              ayah.transliteration.toLowerCase().includes(searchTerm) ||
              sura.name.includes(searchTerm) ||
              sura.nameTranslation.toLowerCase().includes(searchTerm)) {
            results.push({
              suraNumber: sura.number,
              suraName: sura.name,
              suraNameTranslation: sura.nameTranslation,
              ayahNumber: ayah.number,
              arabic: ayah.arabic,
              translation: ayah.translation,
              transliteration: ayah.transliteration
            });
          }
        });
      });
      
      return results;
    }
  };
