// PreSignUp Lambda simplificado - Sin acceso a DB
// Solo auto-confirma usuarios

export const handler = async (event: any) => {
  console.log('PreSignUp event:', JSON.stringify(event, null, 2));

  const email = event.request.userAttributes.email;

  // Auto-confirmar el usuario
  event.response.autoConfirmUser = true;
  
  // Auto-verificar el email
  event.response.autoVerifyEmail = true;

  console.log(`User ${email} auto-confirmed`);

  return event;
};

