"""
Bir martalik: har movie'ga +5 collocation (jami 10) va writing topshirig'ini qo'shadi.
Takror ishga tushirsa ham xavfsiz (bor id'lar qayta qo'shilmaydi).
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "data" / "units"


def c(cid, word, ipa, emoji, uz, ex, cloze=None, note=None):
    d = {"id": cid, "word": word, "ipa": ipa, "emoji": emoji, "translation": uz, "example": ex}
    if cloze: d["cloze"] = cloze
    if note: d["note"] = note
    return d


# movie id → (5 ta yangi collocation, writing topshirig'i)
ADD = {
    "fg1": ([
        c("fg1-c-believe", "believe in sb", "/bɪˈliːv ɪn/", "🙏", "kimgadir ishonmoq", "His mother always believed in him.", "believed in"),
        c("fg1-c-advice", "give advice", "/ˌɡɪv ədˈvaɪs/", "💬", "maslahat bermoq", "She gave him simple advice for difficult moments.", "gave him simple advice", "advice — sanalmaydi: an advice emas"),
        c("fg1-c-join", "join the army", "/ˌdʒɔɪn ði ˈɑː.mi/", "🪖", "armiyaga qo'shilmoq", "Later he joined the army and went to Vietnam.", "joined the army"),
        c("fg1-c-luck", "bad luck", "/ˌbæd ˈlʌk/", "🍀", "omadsizlik", "After a long period of bad luck, the company became successful."),
        c("fg1-c-laugh", "laugh at sb", "/ˈlɑːf ət/", "😆", "kimustidan kulmoq", "Other children used to laugh at him.", "laugh at"),
    ], "Write about a person who believed in you when others didn't. Who were they, what did they do, and how did it change you? Use at least 6 words from this movie."),
    "sh1": ([
        c("sh1-c-place", "the same place", "/ðə ˌseɪm ˈpleɪs/", "📍", "o'sha joy", "He stayed in the same place all winter."),
        c("sh1-c-move", "move to", "/ˈmuːv tə/", "🚚", "... ga ko'chib o'tmoq", "Jack moves there with his wife and son.", "moves there"),
        c("sh1-c-close", "close for the winter", "/ˌkləʊz fə ðə ˈwɪn.tə/", "🔒", "qishga yopilmoq", "The hotel closes every winter.", "closes every winter"),
        c("sh1-c-ability", "a special ability", "/ə ˌspeʃ.əl əˈbɪl.ə.ti/", "✨", "alohida qobiliyat", "Danny has a special ability called the shining."),
        c("sh1-c-slowly", "slowly change", "/ˌsləʊ.li ˈtʃeɪndʒ/", "🐢", "asta-sekin o'zgarmoq", "The isolation was slowly changing him.", "slowly changing"),
    ], "Describe an evening when something strange happened to you. What were you doing when it happened? Use Past Continuous and Past Simple, and at least 6 words from this movie."),
    "hp1": ([
        c("hp1-c-truth", "learn the truth", "/ˌlɜːn ðə ˈtruːθ/", "🗝", "haqiqatni bilib olmoq", "Harry learns the truth about his parents.", "learns the truth"),
        c("hp1-c-talent", "a natural talent", "/ə ˌnætʃ.ər.əl ˈtæl.ənt/", "🎁", "tug'ma iste'dod", "He has a natural talent for it."),
        c("hp1-c-courage", "show courage", "/ˌʃəʊ ˈkʌr.ɪdʒ/", "🦁", "jasorat ko'rsatmoq", "Harry shows courage.", "shows courage"),
        c("hp1-c-home", "a real home", "/ə ˌrɪəl ˈhəʊm/", "🏡", "haqiqiy uy (oila)", "Harry has found a real home and real friends."),
        c("hp1-c-birthday", "on sb's birthday", "/ɒn ... ˈbɜːθ.deɪ/", "🎂", "tug'ilgan kunida", "On his eleventh birthday a giant arrives.", "eleventh birthday"),
    ], "Write about a moment that changed your life. What has changed since then? Use Present Perfect (has/have + V3) and Past Simple, and at least 6 words from this movie."),
    "int1": ([
        c("int1-c-lead", "lead to", "/ˈliːd tə/", "➡️", "... ga olib bormoq", "The signs lead Cooper to a secret NASA base.", "lead Cooper to"),
        c("int1-c-save", "save humanity", "/ˌseɪv hjuːˈmæn.ə.ti/", "🌍", "insoniyatni qutqarmoq", "They have a plan to save humanity."),
        c("int1-c-solve", "solve an equation", "/ˌsɒlv ən ɪˈkweɪ.ʒən/", "🧮", "tenglamani yechmoq", "She has been trying to solve the equation.", "solve the equation"),
        c("int1-c-fly", "fly a mission", "/ˌflaɪ ə ˈmɪʃ.ən/", "🚀", "missiyani boshqarib uchmoq", "Cooper agrees to fly the mission.", "fly the mission"),
        c("int1-c-near", "the near future", "/ðə ˌnɪə ˈfjuː.tʃə/", "🔮", "yaqin kelajak", "In the near future, dust storms destroy crops."),
    ], "Write about something you have been doing for a long time (a hobby, sport, learning). How long have you been doing it and why? Use Present Perfect Continuous and at least 6 words from this movie."),
    "inc1": ([
        c("inc1-c-enter", "enter sb's dreams", "/ˈen.tə ... ˈdriːmz/", "💤", "tushiga kirmoq", "He enters people's dreams and steals their secrets.", "enters people's dreams"),
        c("inc1-c-steal", "steal a secret", "/ˌstiːl ə ˈsiː.krət/", "🗝", "sirni o'g'irlamoq", "He steals their secrets.", "steals their secrets"),
        c("inc1-c-team", "build a team", "/ˌbɪld ə ˈtiːm/", "👥", "jamoa tuzmoq", "Cobb builds a team.", "builds a team"),
        c("inc1-c-plant", "plant an idea", "/ˌplɑːnt ən aɪˈdɪə/", "🌱", "g'oyani singdirmoq", "The job is not to steal an idea but to plant one.", "plant one"),
        c("inc1-c-check", "check if", "/ˈtʃek ɪf/", "✅", "... ekanini tekshirmoq", "He spins his top to check if he is awake."),
    ], "Tell a story about a time you were late, lost or confused. What had happened before that? Use Past Perfect at least 4 times and at least 6 words from this movie."),
    "lotr1": ([
        c("lotr1-c-ring", "a gold ring", "/ə ˌɡəʊld ˈrɪŋ/", "💍", "oltin uzuk", "His uncle gives him a gold ring."),
        c("lotr1-c-world", "rule the world", "/ˌruːl ðə ˈwɜːld/", "🌍", "dunyoga hukmronlik qilmoq", "He will rule the whole world.", "rule the whole world"),
        c("lotr1-c-journey", "continue a journey", "/kənˌtɪn.juː ə ˈdʒɜː.ni/", "🗺", "safarni davom ettirmoq", "The two friends continue the journey together.", "continue the journey"),
        c("lotr1-c-hard", "a hard choice", "/ə ˌhɑːd ˈtʃɔɪs/", "⚖️", "qiyin tanlov", "He makes a hard choice."),
        c("lotr1-c-together", "go together", "/ˌɡəʊ təˈɡeð.ə/", "👫", "birga bormoq", "Sam decides to go with him, and they go together."),
    ], "Write about your plans for the next year. What are you going to do, what will probably happen, and what have you already arranged? Use will, going to and Present Continuous, plus at least 6 words from this movie."),
    "sw1": ([
        c("sw1-c-dream", "dream of doing", "/ˈdriːm əv ˌduː.ɪŋ/", "💭", "... ni orzu qilmoq", "He dreams of flying spaceships.", "dreams of flying"),
        c("sw1-c-message", "a secret message", "/ə ˌsiː.krət ˈmes.ɪdʒ/", "✉️", "maxfiy xabar", "Inside R2-D2 there is a secret message."),
        c("sw1-c-trust", "trust your feelings", "/ˌtrʌst jə ˈfiː.lɪŋz/", "🫀", "his-tuyg'ularga ishonmoq", "He switches off the computer and trusts the Force.", "trusts the Force"),
        c("sw1-c-years", "for many years", "/fə ˌmen.i ˈjɪəz/", "⏳", "ko'p yillar davomida", "A Jedi has to train for many years."),
        c("sw1-c-brave", "brave enough", "/ˌbreɪv ɪˈnʌf/", "🦁", "yetarlicha jasur", "You can become a hero if you are brave enough to try."),
    ], "Write about the rules in your job or home. What must you do, what do you have to do, what don't you have to do? Use can, could, must and have to, plus at least 6 words from this movie."),
    "bat1": ([
        c("bat1-c-control", "control your fear", "/kənˌtrəʊl jə ˈfɪə/", "🧘", "qo'rquvini jilovlamoq", "Bruce learns to control his fear.", "control his fear"),
        c("bat1-c-world", "around the world", "/əˌraʊnd ðə ˈwɜːld/", "🌍", "butun dunyo bo'ylab", "He travels around the world."),
        c("bat1-c-guilty", "feel guilty", "/ˌfiːl ˈɡɪl.ti/", "😔", "o'zini aybdor his qilmoq", "Bruce feels guilty and angry for years.", "feels guilty"),
        c("bat1-c-help", "with the help of", "/wɪð ðə ˈhelp əv/", "🤝", "... yordamida", "With the help of his butler Alfred, he creates a new identity."),
        c("bat1-c-join", "join a group", "/ˌdʒɔɪn ə ˈɡruːp/", "👥", "guruhga qo'shilmoq", "A mysterious man invites him to join a secret group.", "join a secret group"),
    ], "Write a short interview (8–10 questions and answers) with Bruce Wayne. Use different question forms and at least 3 tag questions, plus at least 6 words from this movie."),
    "ven1": ([
        c("ven1-c-show", "a TV show", "/ə ˌtiː ˈviː ʃəʊ/", "📺", "teleko'rsatuv", "He has a popular TV show."),
        c("ven1-c-voice", "hear a voice", "/ˌhɪər ə ˈvɔɪs/", "🗣", "ovoz eshitmoq", "Eddie hears a voice in his head.", "hears a voice"),
        c("ven1-c-badly", "go badly", "/ˌɡəʊ ˈbæd.li/", "📉", "yomon o'tmoq", "The interview goes badly.", "goes badly"),
        c("ven1-c-team", "become a team", "/bɪˌkʌm ə ˈtiːm/", "🤝", "jamoaga aylanmoq", "Slowly they become a team."),
        c("ven1-c-truth", "tell the truth about", "/ˌtel ðə ˈtruːθ əˌbaʊt/", "📰", "... haqida haqiqatni aytmoq", "He tells the truth about powerful people.", "tells the truth about"),
    ], "Describe your city or town for a tourist: a place to visit, the best food, the most interesting street. Check every a / an / the. Use at least 6 words from this movie."),
    "tf1": ([
        c("tf1-c-money", "a little money", "/ə ˌlɪt.əl ˈmʌn.i/", "💵", "ozgina pul", "He buys an old car with the little money his father gives him.", "little money"),
        c("tf1-c-years", "many years ago", "/ˌmen.i ˌjɪəz əˈɡəʊ/", "📜", "ko'p yillar oldin", "Many years ago, there was a war on Cybertron."),
        c("tf1-c-hidden", "be hidden in", "/bi ˈhɪd.ən ɪn/", "🙈", "... ichida yashirilgan bo'lmoq", "A few clues are hidden in the glasses.", "are hidden in"),
        c("tf1-c-protect", "protect sth", "/prəˈtekt/", "🛡", "himoya qilmoq", "He decides to protect the cube.", "protect the cube"),
        c("tf1-c-time", "very little time", "/ˌver.i ˌlɪt.əl ˈtaɪm/", "⏰", "juda kam vaqt", "There is very little time to stop them."),
    ], "Write about your kitchen or your bag: what is there a lot of, a few, a little, not much, not many? Use countable and uncountable nouns correctly and at least 6 words from this movie."),
    "dr1": ([
        c("dr1-c-name", "tell sb your name", "/ˌtel ... jə ˈneɪm/", "🪪", "ismini aytmoq", "He never tells anyone his name.", "tells anyone his name"),
        c("dr1-c-job", "one last job", "/ˌwʌn ˌlɑːst ˈdʒɒb/", "🎬", "oxirgi bir ish", "He decides to help him with one last job."),
        c("dr1-c-prison", "come home from prison", "/ˌkʌm həʊm frəm ˈprɪz.ən/", "🚪", "qamoqdan qaytmoq", "Her husband comes home from prison.", "comes home from prison"),
        c("dr1-c-safe", "keep sb safe", "/ˌkiːp ... ˈseɪf/", "🛡", "xavfsiz saqlamoq", "He wants to keep Irene and Benicio safe.", "keep Irene and Benicio safe"),
        c("dr1-c-gun", "carry a gun", "/ˌkær.i ə ˈɡʌn/", "🔫", "qurol olib yurmoq", "He never carries a gun.", "carries a gun"),
    ], "Write about a person you admire. Use so ... that, such a ... that, too and enough at least once each, plus at least 6 words from this movie."),
    "unc1": ([
        c("unc1-c-grow", "grow up", "/ˌɡrəʊ ˈʌp/", "🧒", "ulg'aymoq", "Nathan Drake grew up in an orphanage.", "grew up"),
        c("unc1-c-run", "run away", "/ˌrʌn əˈweɪ/", "🏃", "qochib ketmoq", "When Sam ran away, he promised to come back.", "ran away"),
        c("unc1-c-back", "come back for sb", "/ˌkʌm ˈbæk fə/", "↩️", "kimningdir ortidan qaytib kelmoq", "He promised to come back for Nate.", "come back for"),
        c("unc1-c-after", "be after sth", "/bi ˈɑːf.tə/", "🎯", "... ning ortidan quvmoq", "A rich man is also after the treasure.", "is also after"),
        c("unc1-c-out", "fall out of", "/ˌfɔːl ˈaʊt əv/", "🪂", "... dan tushib ketmoq", "Nate falls out of a plane.", "falls out of"),
    ], "Write about your best trip or adventure. Use at least 8 phrasal verbs (set off, turn up, work out, give up...) and at least 6 words from this movie."),
    "im1": ([
        c("im1-c-sold", "be sold to", "/bi ˈsəʊld tə/", "🏷", "... ga sotilmoq", "The weapons are sold to the army all over the world.", "are sold to"),
        c("im1-c-world", "all over the world", "/ˌɔːl ˌəʊ.və ðə ˈwɜːld/", "🌐", "butun dunyoda", "They are sold all over the world.", "all over the world"),
        c("im1-c-secret", "tell sb a secret", "/ˌtel ... ə ˈsiː.krət/", "🤫", "sirni aytmoq", "Tony tells the world his secret.", "tells the world his secret"),
        c("im1-c-part", "old parts", "/ˌəʊld ˈpɑːts/", "⚙️", "eski ehtiyot qismlar", "The suit is made from old weapon parts.", "old weapon parts"),
        c("im1-c-board", "the board of directors", "/ðə ˌbɔːd əv daɪˈrek.təz/", "🧑‍💼", "direktorlar kengashi", "The board of directors is not happy."),
    ], "Describe how something is made or done (tea, plov, a phone, a website). Use the passive voice at least 6 times and at least 6 words from this movie."),
    "irb1": ([
        c("irb1-c-follow", "follow a law", "/ˌfɒl.əʊ ə ˈlɔː/", "📜", "qonunga amal qilmoq", "Every robot follows three laws.", "follows three laws"),
        c("irb1-c-accident", "have an accident", "/ˌhæv ən ˈæk.sɪ.dənt/", "🚗", "baxtsiz hodisaga uchramoq", "Years ago he had a car accident.", "had a car accident"),
        c("irb1-c-work", "work together", "/ˌwɜːk təˈɡeð.ə/", "🤝", "birga ishlamoq", "Spooner and Sonny work together to stop VIKI."),
        c("irb1-c-freedom", "lose freedom", "/ˌluːz ˈfriː.dəm/", "🗽", "erkinlikni yo'qotmoq", "Humans will lose their freedom.", "lose their freedom"),
        c("irb1-c-feel", "feel emotions", "/ˌfiːl ɪˈməʊ.ʃənz/", "❤️", "his-tuyg'ularni his qilmoq", "He seems to feel emotions."),
    ], "Will robots take our jobs? Write your opinion. Use zero and first conditionals at least 5 times, plus at least 6 words from this movie."),
    "fc1": ([
        c("fc1-c-office", "an office job", "/ən ˈɒf.ɪs ˌdʒɒb/", "🖥", "ofis ishi", "The narrator has a good office job.", "office job"),
        c("fc1-c-sleep", "can't sleep", "/ˌkɑːnt ˈsliːp/", "😵", "uxlay olmaslik", "He can't sleep and he feels empty inside."),
        c("fc1-c-buy", "buy more and more", "/ˌbaɪ ˌmɔːr ən ˈmɔː/", "🛍", "tobora ko'proq sotib olmoq", "He buys more and more things.", "buys more and more"),
        c("fc1-c-feel", "feel alive", "/ˌfiːl əˈlaɪv/", "💓", "o'zini tirik his qilmoq", "The men feel alive for the first time in years."),
        c("fc1-c-measure", "measure by", "/ˈmeʒ.ə baɪ/", "📏", "... bilan o'lchamoq", "We measure ourselves by money and possessions.", "measure ourselves by"),
    ], "If you had one million dollars, how would your life change? And what would stay the same? Use the second conditional at least 6 times and at least 6 words from this movie."),
    "tdk1": ([
        c("tdk1-c-court", "in court", "/ɪn ˈkɔːt/", "⚖️", "sudda", "Harvey Dent fights criminals in court."),
        c("tdk1-c-choice", "make a choice", "/ˌmeɪk ə ˈtʃɔɪs/", "🔀", "tanlov qilmoq", "He forces Batman to make impossible choices.", "make impossible choices"),
        c("tdk1-c-wrong", "the wrong address", "/ðə ˌrɒŋ əˈdres/", "❌", "noto'g'ri manzil", "The Joker has given him the wrong address."),
        c("tdk1-c-badly", "badly burned", "/ˌbæd.li ˈbɜːnd/", "🔥", "qattiq kuygan", "Half of his face is badly burned."),
        c("tdk1-c-enough", "not enough", "/ˌnɒt ɪˈnʌf/", "➖", "yetarli emas", "Sometimes the truth is not enough."),
    ], "Think about a decision from your past. If you had made a different choice, what would have happened? Use the third conditional at least 5 times and at least 6 words from this movie."),
    "ff1": ([
        c("ff1-c-pretend", "pretend to be", "/prɪˈtend tə bi/", "🎭", "o'zini ... qilib ko'rsatmoq", "Brian pretends to be a racer."),
        c("ff1-c-important", "more important than", "/ˌmɔːr ɪmˈpɔː.tənt ðən/", "❗", "... dan muhimroq", "Nothing is more important than family."),
        c("ff1-c-life", "save sb's life", "/ˌseɪv ... ˈlaɪf/", "🛟", "kimningdir hayotini saqlab qolmoq", "He calls a helicopter to save Vince's life.", "save Vince's life"),
        c("ff1-c-hurt", "badly hurt", "/ˌbæd.li ˈhɜːt/", "🤕", "qattiq jarohatlangan", "Dom's friend Vince is badly hurt."),
        c("ff1-c-change", "change your life forever", "/ˌtʃeɪndʒ jə ˈlaɪf fəˈrev.ə/", "🔄", "hayotini butunlay o'zgartirmoq", "The decision changes his life forever.", "changes his life forever"),
    ], "Write about a mistake you made. What should you have done, what shouldn't you have done, and what could you have done instead? Use at least 6 words from this movie."),
    "se7": ([
        c("se7-c-crime", "far from crime", "/ˌfɑː frəm ˈkraɪm/", "🏞", "jinoyatdan uzoqda", "He wishes he could live somewhere quiet, far from crime."),
        c("se7-c-change", "change things", "/ˌtʃeɪndʒ ˈθɪŋz/", "🔧", "vaziyatni o'zgartirmoq", "He believes he can change things."),
        c("se7-c-connected", "be connected to", "/bi kəˈnek.tɪd tə/", "🔗", "... ga bog'liq bo'lmoq", "Each crime is connected to one of the seven sins.", "is connected to"),
        c("se7-c-understand", "try to understand", "/ˌtraɪ tu ˌʌn.dəˈstænd/", "🧠", "tushunishga harakat qilmoq", "He reads old books to understand the killer.", "to understand"),
        c("se7-c-worth", "worth fighting for", "/ˌwɜːθ ˈfaɪ.tɪŋ fɔː/", "✊", "kurashishga arziydi", "The world is worth fighting for."),
    ], "Write about three wishes: one about your present life, one about the past and one about other people's habits. Use wish / if only correctly and at least 6 words from this movie."),
    "bcs1": ([
        c("bcs1-c-firm", "a big firm", "/ə ˌbɪɡ ˈfɜːm/", "🏢", "yirik firma", "Chuck is a respected lawyer at a big firm."),
        c("bcs1-c-law", "study law", "/ˌstʌd.i ˈlɔː/", "📚", "huquqshunoslikni o'qimoq", "Jimmy studies law by post.", "studies law"),
        c("bcs1-c-way", "the easy way", "/ði ˌiː.zi ˈweɪ/", "🛣", "oson yo'l", "Jimmy chooses the easy, dishonest way.", "the easy, dishonest way"),
        c("bcs1-c-energy", "a lot of energy", "/ə ˌlɒt əv ˈen.ə.dʒi/", "⚡", "katta g'ayrat", "He has a lot of energy and charm."),
        c("bcs1-c-change", "change its spots", "/ˌtʃeɪndʒ ɪts ˈspɒts/", "🐆", "(ibora) tabiatini o'zgartirmoq", "A leopard can't change its spots."),
    ], "Look at a photo of a stranger (or imagine one). Who might they be? What must they have done today? What can't they be? Write 10 sentences with must / might / can't (have).Use at least 6 words from this movie."),
    "bb1": ([
        c("bb1-c-live", "a few years to live", "/ə ˌfjuː ˌjɪəz tə ˈlɪv/", "⏳", "yashashga bir necha yil", "He has only a few years to live."),
        c("bb1-c-business", "drug business", "/ˈdrʌɡ ˌbɪz.nɪs/", "🚫", "giyohvand savdosi", "Jesse works in the illegal drug business."),
        c("bb1-c-name", "choose a name", "/ˌtʃuːz ə ˈneɪm/", "🏷", "nom tanlamoq", "He even chooses a new name for himself.", "chooses a new name"),
        c("bb1-c-table", "at the dinner table", "/ət ðə ˈdɪn.ə ˌteɪ.bəl/", "🍽", "kechki ovqat stolida", "The criminal is sitting at the same dinner table.", "at the same dinner table"),
        c("bb1-c-become", "become a partner", "/bɪˌkʌm ə ˈpɑːt.nə/", "🤝", "sherik bo'lmoq", "Walter wants to become his partner.", "become his partner"),
    ], "Report a conversation you had this week. Start with: \"My friend told me that...\" and \"He asked me if...\". Use reported speech at least 8 times and at least 6 words from this movie."),
    "got1": ([
        c("got1-c-rule", "be ruled by", "/bi ˈruːld baɪ/", "👑", "... tomonidan boshqarilmoq", "Seven kingdoms are ruled by one king.", "ruled by"),
        c("got1-c-friend", "an old friend", "/ən ˌəʊld ˈfrend/", "🤝", "eski do'st", "His old friend, King Robert, asks Ned to come.", "old friend"),
        c("got1-c-sea", "across the sea", "/əˌkrɒs ðə ˈsiː/", "🌊", "dengizning narigi tomonida", "Across the sea, Daenerys receives three eggs."),
        c("got1-c-destroy", "destroy a family", "/dɪˌstrɔɪ ə ˈfæm.əl.i/", "💥", "oilani barbod qilmoq", "The secret could destroy the queen's family.", "destroy the queen's family"),
        c("got1-c-stop", "decide to stop sb", "/dɪˌsaɪd tə ˈstɒp/", "✋", "kimnidir to'xtatishga qaror qilmoq", "They decide to stop him.", "decide to stop"),
    ], "Describe your family or team: who does what, which places are important to you, whose ideas matter most. Use who, which, that, whose and where, plus at least 6 words from this movie."),
    "pb1": ([
        c("pb1-c-war", "come home from the war", "/ˌkʌm ˈhəʊm frəm ðə ˈwɔː/", "🪖", "urushdan qaytmoq", "Men have come home with terrible memories.", "come home"),
        c("pb1-c-control", "control the city", "/kənˌtrəʊl ðə ˈsɪt.i/", "🏙", "shaharni nazorat qilmoq", "The gang controls illegal betting in the city.", "controls illegal betting in the city"),
        c("pb1-c-stop", "stop doing", "/ˈstɒp ˌduː.ɪŋ/", "⛔", "... qilishni to'xtatmoq", "Tommy doesn't stop working.", "stop working"),
        c("pb1-c-enemy", "an old enemy", "/ən ˌəʊld ˈen.ə.mi/", "⚔️", "eski dushman", "He can't stop fighting old enemies.", "old enemies"),
        c("pb1-c-quiet", "think quietly", "/ˌθɪŋk ˈkwaɪ.ət.li/", "🤔", "jim o'ylamoq", "He prefers to think quietly."),
    ], "Write about your ambitions. What do you enjoy doing, what do you want to do, what do you avoid doing, and what do you dream of? Use gerunds and infinitives correctly and at least 6 words from this movie."),
}


for path in sorted(ROOT.glob("*.json")):
    u = json.loads(path.read_text(encoding="utf-8"))
    if u["id"] not in ADD:
        raise SystemExit(f"{u['id']} uchun ma'lumot yo'q")
    extra, task = ADD[u["id"]]
    have = {w["id"] for w in u["collocations"]}
    u["collocations"] += [w for w in extra if w["id"] not in have]
    u["writing"] = {"task": task, "minWords": 100 if u["level"].startswith("B2") else 80}
    path.write_text(json.dumps(u, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("tayyor")
