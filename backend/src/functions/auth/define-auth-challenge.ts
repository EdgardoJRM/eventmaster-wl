import { DefineAuthChallengeCommandOutput } from '@aws-sdk/client-cognito-identity-provider';

export const handler = async (event: any) => {
  console.log('DefineAuthChallenge event:', JSON.stringify(event, null, 2));

  // Si el usuario no existe, crear el challenge
  if (event.request.session.length === 0) {
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
  }
  // Si el usuario completó el challenge, emitir tokens
  else if (
    event.request.session.length === 1 &&
    event.request.session[0].challengeName === 'CUSTOM_CHALLENGE' &&
    event.request.session[0].challengeResult === true
  ) {
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  }
  // Si falló, rechazar
  else {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  }

  return event;
};

