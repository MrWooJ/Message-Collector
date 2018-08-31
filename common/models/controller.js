const Promise = require('bluebird');
Promise.config({
  cancellation: true
});

const TelegramBot = require('node-telegram-bot-api')

var app = require('../../server/server')

module.exports = function (controller) {

  const token = '522449583:AAGabyAVdeDt4ugOpopCcwUmTD8Jy6SMuKg'

  var bot = new TelegramBot(token, {
    polling: true
	})

	if (!bot)
		throw 'bot not defined'

	function clearingMessagesBox(userId, cb) {
		controller.find({'where':{'telegramId': userId}}, function(error, messageList){
			if (!error && messageList.length > 0) {
				var counter = 0
				for (var i = 0; i < messageList.length; i++) {
					var modelId = messageList[i].id
					controller.destroyById(modelId, function(err) {
						counter++
						if (counter == i)
							cb('Ok')
					})
				}
			}
			else {
				cb('Ok')
			}
		})
	}

  bot.onText(/\/start/, (msg) => {
		console.log('On Start: ')
		console.log(msg)
		var userId = msg.chat.id
		var welcomeText = 'سلام عزیزجانم 💗\nخیلی خوش اومدی 🤗🌸\n\nنحوه کار با من خیلی ساده‌ست.\nفقط باید بعد از شروع، همه پیام‌هاتو یکجا به من فوروارد کنی و در آخر گزینه «جمع‌بندی و ارسال» رو بزنی و منتظر باشی تا به سرعت پیام‌هاتو جمع‌بندی و تبدیل به یک پیام کنم. به همین سادگی!\n\nفعلا تنها محدودیتی که دارم اینه که همه پیام‌های ارسالیت باید در قالب متن باشه، نه کپشت عکس و فایل.\n\nامیدوارم دوست مفیدی برات باشم 😉😊'
		var options = {
			reply_markup: JSON.stringify({
				resize_keyboard: true,
				selective: true,
				keyboard: [
					['جمع‌بندی و ارسال 😌'],
					['بیخیال 😕']
				]
			})		
		}
		clearingMessagesBox(userId, function(result) {
			if (result === 'Ok')
				bot.sendMessage(userId, welcomeText, options)
		})
  })

	bot.onText(/(.+)/, function onEchoText(msg, match) {
		console.log('On Text: ')
		console.log(msg)
		var userId = msg.chat.id
		var message = msg.text
		var words = ['جمع‌بندی و ارسال 😌', 'بیخیال 😕', "/start"]
		if (words.indexOf(message) >= 0)
			return
		
		var data = {
			telegramId: userId,
			message: message
		}
		controller.create(data, function(error, messageModel){
			if (error) {
				var options = {
					reply_markup: JSON.stringify({
						resize_keyboard: true,
						selective: true,
						keyboard: [
							['جمع‌بندی و ارسال 😌'],
							['بیخیال 😕']
						]
					})		
				}
				bot.sendMessage(userId, error.toString(), options)				
			}
		})
	})

  bot.onText(/جمع‌بندی و ارسال/, (msg) => {
		console.log('On Gather & Send: ')
		console.log(msg)
		var userId = msg.chat.id
		controller.find({'where':{'telegramId': userId}}, function(error, messageList){
			if (!error && messageList.length > 0) {
				var fullMessage = ''
				for (var i = 0; i < messageList.length; i++) {
					fullMessage += '\n'
					fullMessage += messageList[i].message
				}
				bot.sendMessage(userId, fullMessage)
			}
			else {
				var options = {
					reply_markup: JSON.stringify({
						resize_keyboard: true,
						selective: true,
						keyboard: [
							['جمع‌بندی و ارسال 😌'],
							['بیخیال 😕']
						]
					})		
				}
				var noMessage = 'عزیزم شما هیچ پیامی ارسال نکردی 🙁 اول پیام‌هاتو ارسال کن و بعد من همه رو جمع‌بندی میکنم 😌'
				bot.sendMessage(userId, noMessage)
			}
		})
	})

  bot.onText(/بیخیال/, (msg) => {
		console.log('On Cancel: ')
		console.log(msg)
		var userId = msg.chat.id
		clearingMessagesBox(userId, function(result) {
			if (result === 'Ok') {
				var revokeMessage = 'خیلی خب، عملیات جمع‌بندی رو لغو کردم 🤓'
				bot.sendMessage(userId, revokeMessage)
			}
		})
  })
	
}
