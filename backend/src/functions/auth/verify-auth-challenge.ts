export const handler = async (event: any) => {
  console.log('VerifyAuthChallenge event:', JSON.stringify(event, null, 2));

  const expectedCode = event.request.privateChallengeParameters.secretCode;
  const providedCode = event.request.challengeAnswer;

  // Verificar que el código proporcionado coincida
  if (providedCode === expectedCode) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }

  return event;
};

