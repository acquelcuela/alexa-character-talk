const Alexa = require('ask-sdk-core');
const axios = require('axios');

// 定数読込
const config = require('./config');
// 設定読込
const character = require('./characterSetting');

// ChatGPTとの接続（APIコール）
async function getChatGptResponse(input) {
  const endpoint = `${config.END_POINT}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.GPT_AUTHORIZATION_TOKEN}`,
  };

  const data = {
    prompt: input,
    max_tokens: 2000,
    model: "text-davinci-003"
  };

  try {
    const response = await axios.post(endpoint, data, { headers });
    return response.data.choices[0].text;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// 【以下、Alexaイベント】******************************************************

// 起動時に発火
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = `${config.MESSAGE_LAUNCH}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withSimpleCard(
                `${config.MESSAGE_TITLE}`, 
                speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// メインコンテンツ
const KaerutanTalkIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    async handle(handlerInput) {

        // ChatGPTに投げる内容を作成
        const speechText = `${character.CHARACTER_SETTING}` + '\n' + handlerInput.requestEnvelope.request.intent.slots.message.value;
        console.log('speechText:'+speechText);
        
        // ChatGPTをコール
        const response =  await getChatGptResponse(speechText);
        console.log('response:'+response);
        
        return handlerInput.responseBuilder
            .speak(response)
            .withSimpleCard(
                `${config.MESSAGE_TITLE}`, 
                response)            
            .reprompt(response)
            .getResponse();
    }
};

// ヘルプ
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = `${config.MESSAGE_HELP}`

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// キャンセル時
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = `${config.MESSAGE_CANCEL}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// ユーザーの発話がスキル内のどのインテントにもマッチしない場合
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = `${config.MESSAGE_FALLBACK}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// セッションの終了
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

// 特定のインテントを反映する
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// エラー発生時
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = `${config.MESSAGE_ERROR}`;
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// ハンドラ設定（順番に意味あり）
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        KaerutanTalkIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('com/kaeru-tan/v1.0')
    .lambda();