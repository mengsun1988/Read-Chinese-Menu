export interface SurvivalCard {
  id?: string;        // 众包卡片会有 KV 生成的 ID，官方卡片对应 i18n key
  category: string;
  en: string;
  cn: string;
  icon: string;
  isOfficial?: boolean;
  votes?: number;
  createdAt?: string;
}

export const SURVIVAL_CATEGORIES = [
  "Safety", "Dining", "Payment", "Taxi", "Health", 
  "Station", "Street", "Sightseeing", "Hotel", "Help"
];

export const OFFICIAL_CARDS: SurvivalCard[] = [
  // 1. Safety (Allergies)
  { id: "no_peanuts", category: "Safety", en: "No peanuts, please.", cn: "请不要放花生", icon: "🥜", isOfficial: true },
  { id: "no_nuts", category: "Safety", en: "I cannot eat nuts.", cn: "我不能吃坚果", icon: "🚫", isOfficial: true },
  { id: "fava_beans", category: "Safety", en: "Are there fava beans?", cn: "这里有蚕豆吗", icon: "🌱", isOfficial: true },
  { id: "lactose", category: "Safety", en: "Lactose intolerant.", cn: "我乳糖不耐受", icon: "🥛", isOfficial: true },
  { id: "seafood_allergy", category: "Safety", en: "Severe seafood allergy.", cn: "我对海鲜严重过敏", icon: "🦐", isOfficial: true },
  { id: "must_non_spicy", category: "Safety", en: "Must be non-spicy.", cn: "完全不能吃辣", icon: "🌶️", isOfficial: true },
  { id: "no_msg", category: "Safety", en: "No MSG, please.", cn: "请不要放味精", icon: "🧂", isOfficial: true },
  { id: "no_pork", category: "Safety", en: "I don't eat pork.", cn: "我不吃猪肉", icon: "🐷", isOfficial: true },
  { id: "vegetarian", category: "Safety", en: "I am a vegetarian.", cn: "我是素食主义者", icon: "🥬", isOfficial: true },
  { id: "no_cilantro", category: "Safety", en: "Allergic to cilantro.", cn: "我对香菜过敏", icon: "🌿", isOfficial: true },

  // 2. Dining
  { id: "menu_please", category: "Dining", en: "Menu, please.", cn: "麻烦给我菜单", icon: "📜", isOfficial: true },
  { id: "specialty", category: "Dining", en: "What's the specialty?", cn: "招牌菜是什么", icon: "👑", isOfficial: true },
  { id: "one_of_this", category: "Dining", en: "I'd like one of this.", cn: "我想要一份这个", icon: "☝️", isOfficial: true },
  { id: "ice_water", category: "Dining", en: "Do you have ice water?", cn: "有冰水吗", icon: "🧊", isOfficial: true },
  { id: "need_fork", category: "Dining", en: "Could I have a fork?", cn: "麻烦给我叉子", icon: "🍴", isOfficial: true },
  { id: "tissues", category: "Dining", en: "Tissues, please.", cn: "麻烦给我纸巾", icon: "🧻", isOfficial: true },
  { id: "restroom", category: "Dining", en: "Where's the restroom?", cn: "洗手间在哪里", icon: "🚻", isOfficial: true },
  { id: "order_now", category: "Dining", en: "Can we order now?", cn: "我们可以点菜了吗", icon: "📝", isOfficial: true },
  { id: "too_salty", category: "Dining", en: "This is too salty.", cn: "这个菜太咸了", icon: "🧂", isOfficial: true },
  { id: "doggy_bag", category: "Dining", en: "A doggy bag, please.", cn: "请给我打包盒", icon: "🥡", isOfficial: true },

  // 3. Payment
  { id: "check_please", category: "Payment", en: "Check, please.", cn: "买单，谢谢", icon: "💰", isOfficial: true },
  { id: "who_scans", category: "Payment", en: "Who scans whom?", cn: "我扫你还是你扫我", icon: "📲", isOfficial: true },
  { id: "mobile_pay", category: "Payment", en: "Alipay/WeChat Pay?", cn: "能用支付宝微信吗", icon: "💳", isOfficial: true },
  { id: "receipt", category: "Payment", en: "Digital receipt, please.", cn: "要电子发票小票", icon: "🧾", isOfficial: true },
  { id: "how_much", category: "Payment", en: "How much is this?", cn: "这个多少钱", icon: "🏷️", isOfficial: true },
  { id: "cheaper", category: "Payment", en: "Bit cheaper, please?", cn: "便宜一点吧", icon: "📉", isOfficial: true },
  { id: "no_cash", category: "Payment", en: "I don't have cash.", cn: "我没有现金", icon: "🚫", isOfficial: true },
  { id: "wifi", category: "Payment", en: "Wi-Fi password?", cn: "无线上网密码多少", icon: "📶", isOfficial: true },
  { id: "charge_phone", category: "Payment", en: "Can I charge here?", cn: "这里可以充电吗", icon: "⚡", isOfficial: true },
  { id: "wrong_change", category: "Payment", en: "Change is incorrect.", cn: "你们找错钱了", icon: "🧐", isOfficial: true },

  // 4. Taxi
  { id: "go_here", category: "Taxi", en: "Go here (Map).", cn: "我要去这个地方", icon: "📍", isOfficial: true },
  { id: "use_meter", category: "Taxi", en: "Use the meter, please.", cn: "请按计价器收费", icon: "🚕", isOfficial: true },
  { id: "how_long", category: "Taxi", en: "How long will it take?", cn: "大约多久能到", icon: "⏳", isOfficial: true },
  { id: "pull_over", category: "Taxi", en: "Pull over here.", cn: "麻烦在路边停一下", icon: "🛑", isOfficial: true },
  { id: "ac_up", category: "Taxi", en: "Turn up the AC.", cn: "空调稍微开大一点", icon: "❄️", isOfficial: true },
  { id: "open_trunk", category: "Taxi", en: "Open the trunk.", cn: "麻烦开一下后备箱", icon: "💼", isOfficial: true },
  { id: "wait_mins", category: "Taxi", en: "Wait a few minutes?", cn: "能等我几分钟吗", icon: "⏱️", isOfficial: true },
  { id: "subway", category: "Taxi", en: "Where's the subway?", cn: "最近的地铁站在哪", icon: "🚇", isOfficial: true },
  { id: "drive_slower", category: "Taxi", en: "Drive slower, please.", cn: "请慢一点开车", icon: "🐢", isOfficial: true },
  { id: "taxi_fare", category: "Taxi", en: "How much to get there?", cn: "到那里大约多少钱", icon: "🪙", isOfficial: true },

  // 5. Health
  { id: "need_doctor", category: "Health", en: "I need a doctor.", cn: "不舒服需要看医生", icon: "👨‍⚕️", isOfficial: true },
  { id: "pharmacy", category: "Health", en: "Nearest pharmacy?", cn: "附近有药店吗", icon: "💊", isOfficial: true },
  { id: "stomach_hurt", category: "Health", en: "Stomach hurts badly.", cn: "我肚子疼得很厉害", icon: "😫", isOfficial: true },
  { id: "cold_med", category: "Health", en: "Fever/Cold medicine?", cn: "发烧了有感冒药吗", icon: "🌡️", isOfficial: true },
  { id: "dizzy", category: "Health", en: "I feel dizzy.", cn: "我觉得头晕", icon: "😵‍💫", isOfficial: true },
  { id: "allergy_med", category: "Health", en: "Any allergy medicine?", cn: "有过敏药吗", icon: "🤧", isOfficial: true },
  { id: "hospital_reg", category: "Health", en: "Where to register?", cn: "请问在哪里挂号", icon: "🏥", isOfficial: true },
  { id: "buy_mask", category: "Health", en: "Where to buy masks?", cn: "哪里可以买到口罩", icon: "😷", isOfficial: true },
  { id: "med_frequency", category: "Health", en: "How many times a day?", cn: "一天吃几次药", icon: "🕒", isOfficial: true },
  { id: "med_record", category: "Health", en: "Medical record/report.", cn: "我需要开一份病历", icon: "📁", isOfficial: true },

  // 6. Station
  { id: "checkin_counter", category: "Station", en: "Check-in counter?", cn: "值机柜台在哪里", icon: "🛫", isOfficial: true },
  { id: "lost_luggage", category: "Station", en: "Luggage is lost.", cn: "我的行李找不到了", icon: "🧳", isOfficial: true },
  { id: "recent_ticket", category: "Station", en: "Ticket for next one.", cn: "买张最近出的车票", icon: "🎟️", isOfficial: true },
  { id: "ticket_time", category: "Station", en: "Ticket checking time?", cn: "几点开始检票", icon: "⏰", isOfficial: true },
  { id: "airport_bus", category: "Station", en: "Bus to the airport?", cn: "去机场的大巴吗", icon: "🚌", isOfficial: true },
  { id: "earlier_departure", category: "Station", en: "Any earlier departure?", cn: "有更早的班次吗", icon: "⏪", isOfficial: true },
  { id: "boarding_gate", category: "Station", en: "Boarding gate?", cn: "登机口站在哪里", icon: "🚪", isOfficial: true },
  { id: "train_delay", category: "Station", en: "Train delayed?", cn: "火车晚点了吗", icon: "🚂", isOfficial: true },
  { id: "print_itinerary", category: "Station", en: "Get ticket/itinerary.", cn: "取票打印行程单", icon: "📄", isOfficial: true },
  { id: "store_luggage", category: "Station", en: "Luggage storage?", cn: "这里可以寄存行李吗", icon: "🔒", isOfficial: true },

  // 7. Street
  { id: "address_direction", category: "Street", en: "How to get here?", cn: "这个地址怎么走", icon: "🗺️", isOfficial: true },
  { id: "walkable", category: "Street", en: "Can I walk there?", cn: "走路多久能到", icon: "🚶", isOfficial: true },
  { id: "convenience_store", category: "Street", en: "Convenience store?", cn: "附近有便利店吗", icon: "🏪", isOfficial: true },
  { id: "power_bank", category: "Street", en: "Shared power bank?", cn: "共享充电宝在哪", icon: "🔋", isOfficial: true },
  { id: "atm", category: "Street", en: "Nearest ATM?", cn: "附近有自动取款机", icon: "🏧", isOfficial: true },
  { id: "unlock_bike", category: "Street", en: "How to unlock bike?", cn: "共享单车怎么开锁", icon: "🚲", isOfficial: true },
  { id: "take_photo", category: "Street", en: "Okay to take photo?", cn: "这里可以拍照吗", icon: "📸", isOfficial: true },
  { id: "sim_card", category: "Street", en: "Buy SIM card?", cn: "哪里卖手机卡", icon: "📱", isOfficial: true },
  { id: "get_delivery", category: "Street", en: "Help get delivery.", cn: "帮我取外卖快递", icon: "📦", isOfficial: true },
  { id: "thanks_help", category: "Street", en: "Thank you for help!", cn: "谢谢你的帮助", icon: "🙏", isOfficial: true },

  // 8. Sightseeing
  { id: "ticket_price", category: "Sightseeing", en: "One ticket price?", cn: "门票多少钱一张", icon: "🎫", isOfficial: true },
  { id: "ticket_office", category: "Sightseeing", en: "Ticket office?", cn: "人工售票处在哪", icon: "💁", isOfficial: true },
  { id: "audio_guide", category: "Sightseeing", en: "English audio guide?", cn: "有英文语音导览吗", icon: "🎧", isOfficial: true },
  { id: "closing_time", category: "Sightseeing", en: "Closing time?", cn: "几点停止入园", icon: "🕙", isOfficial: true },
  { id: "take_photo_us", category: "Sightseeing", en: "Take photo for us?", cn: "帮我们拍张照片吗", icon: "🤳", isOfficial: true },
  { id: "drinking_water", category: "Sightseeing", en: "Drinking water?", cn: "直饮水或卖水的", icon: "💧", isOfficial: true },
  { id: "last_bus", category: "Sightseeing", en: "Last shuttle bus?", cn: "最后一班车几点", icon: "🚍", isOfficial: true },
  { id: "rent_guide", category: "Sightseeing", en: "Rent guide device.", cn: "哪里可以租导览器", icon: "📟", isOfficial: true },
  { id: "cable_car", category: "Sightseeing", en: "Cable car tickets?", cn: "缆车票在哪买", icon: "🚠", isOfficial: true },
  { id: "exit_location", category: "Sightseeing", en: "Where is the exit?", cn: "出口在哪里", icon: "🚪", isOfficial: true },

  // 9. Hotel
  { id: "passport_here", category: "Hotel", en: "Here is my passport.", cn: "这是我的护照", icon: "🛂", isOfficial: true },
  { id: "ac_shower_fail", category: "Hotel", en: "No hot water/AC fail.", cn: "没热水空调不工作", icon: "🚿", isOfficial: true },
  { id: "change_sheets", category: "Hotel", en: "Change bed sheets.", cn: "换一套干净被褥", icon: "🛏️", isOfficial: true },
  { id: "wifi_fail", category: "Hotel", en: "Wi-Fi not working.", cn: "网络怎么连不上", icon: "🌐", isOfficial: true },
  { id: "breakfast_time", category: "Hotel", en: "Breakfast time?", cn: "早餐几点开始", icon: "🍳", isOfficial: true },
  { id: "laundry", category: "Hotel", en: "Laundry service?", cn: "哪里可以洗衣服", icon: "🧼", isOfficial: true },
  { id: "checkout_now", category: "Hotel", en: "I'd like to check out.", cn: "我想办理退房", icon: "🔑", isOfficial: true },
  { id: "hotel_luggage", category: "Hotel", en: "Store luggage?", cn: "能寄存行李吗", icon: "👜", isOfficial: true },
  { id: "call_taxi", category: "Hotel", en: "Call a taxi for me.", icon: "🚕", cn: "麻烦帮我叫车", isOfficial: true },
  { id: "checkout_deadline", category: "Hotel", en: "When should we checkout?", cn: "我们什么时候退房", icon: "🚪", isOfficial: true },

  // 10. Help
  { id: "speak_english", category: "Help", en: "Speak English?", cn: "你会说英语吗", icon: "🗣️", isOfficial: true },
  { id: "say_again", category: "Help", en: "Say that again.", cn: "麻烦再讲一遍", icon: "🔁", isOfficial: true },
  { id: "type_phone", category: "Help", en: "Type on my phone.", cn: "帮我在手机上打字", icon: "⌨️", isOfficial: true },
  { id: "not_understand", category: "Help", en: "I don't understand.", cn: "我听不懂", icon: "🤷", isOfficial: true },
  { id: "emergencies", category: "Help", en: "Help! Emergencies!", cn: "救命帮帮我", icon: "🆘", isOfficial: true },
  { id: "borrow_phone", category: "Help", en: "Can I use your phone?", cn: "手机没电借用电话", icon: "📞", isOfficial: true },
  { id: "lost_friend", category: "Help", en: "Lost my friend.", cn: "找不到同伴了", icon: "🫂", isOfficial: true },
  { id: "police_station", category: "Help", en: "Police station?", cn: "最近的派出所在哪", icon: "👮", isOfficial: true },
  { id: "ambulance", category: "Help", en: "Call an ambulance!", cn: "麻烦帮我叫救护车", icon: "🚑", isOfficial: true },
  { id: "lost_item", category: "Help", en: "Lost my bag/passport.", cn: "包护照掉在车上了", icon: "🎒", isOfficial: true },
];