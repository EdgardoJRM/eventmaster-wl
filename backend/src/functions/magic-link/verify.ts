import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminSetUserPasswordCommand, 
  AdminInitiateAuthCommand, 
  AdminGetUserCommand 
} from '@aws-sdk/client-cognito-identity-provider';
import { createResponse } from '../shared/utils';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

// DB connection (placeholder - needs RDS setup)
async function query(sql: string, params: any[]): Promise<any> {
  // TODO: Implement PostgreSQL connection
  // For now, throw error to indicate not implemented
  throw new Error('Database not configured. Please set up RDS PostgreSQL and implement query function.');
}

function generateSecurePassword(): string {
  // Generate a secure random password that meets Cognito requirements
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Add more random characters
  const allChars = upper + lower + digits + special;
  for (let i = 0; i < 28; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function getOrCreateCognitoUser(email: string): Promise<{ username: string; sub: string; isNew: boolean }> {
  const userPoolId = process.env.USER_POOL_ID || 'us-east-1_BnjZCmw7O';
  
  // Username is email without special chars (for Cognito compatibility)
  const username = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  try {
    // Try to create user (will fail if exists)
    const password = generateSecurePassword();
    
    await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: email.split('@')[0] }, // Required by Events User Pool
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
    }));

    // Set permanent password (user won't need to change it)
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    }));

    // Get the user to retrieve the sub
    const getUserResponse = await cognitoClient.send(new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }));

    const sub = getUserResponse.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;
    if (!sub) {
      throw new Error('Failed to get user sub from Cognito');
    }

    return { username, sub, isNew: true };
  } catch (err: any) {
    if (err.name === 'UsernameExistsException') {
      // User already exists, get their sub
      const getUserResponse = await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      }));

      const sub = getUserResponse.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;
      if (!sub) {
        throw new Error('Failed to get user sub from Cognito');
      }

      return { username, sub, isNew: false };
    }
    throw err;
  }
}

async function generateCognitoTokens(username: string): Promise<any> {
  const userPoolId = process.env.USER_POOL_ID || 'us-east-1_BnjZCmw7O';
  const clientId = process.env.USER_POOL_CLIENT_ID || '5h866q6llftkq2lhidqbm4pntc';

  try {
    // Use AdminInitiateAuth to generate tokens
    const authResponse = await cognitoClient.send(new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: process.env.MAGIC_LINK_PASSWORD || 'EventMaster2025!@#',
      },
    }));

    if (!authResponse.AuthenticationResult) {
      throw new Error('Failed to generate authentication tokens');
    }

    return {
      idToken: authResponse.AuthenticationResult.IdToken,
      accessToken: authResponse.AuthenticationResult.AccessToken,
      refreshToken: authResponse.AuthenticationResult.RefreshToken,
      expiresIn: authResponse.AuthenticationResult.ExpiresIn,
    };
  } catch (err: any) {
    console.error('Error generating Cognito tokens:', err);
    
    // If the user doesn't have a password set, we need to set one
    if (err.name === 'NotAuthorizedException' || err.name === 'UserNotFoundException') {
      // Set a temporary password for the user
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: username,
        Password: process.env.MAGIC_LINK_PASSWORD || 'EventMaster2025!@#',
        Permanent: true,
      }));
      
      // Retry authentication
      const retryResponse = await cognitoClient.send(new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: process.env.MAGIC_LINK_PASSWORD || 'EventMaster2025!@#',
        },
      }));
      
      if (!retryResponse.AuthenticationResult) {
        throw new Error('Failed to generate authentication tokens after setting password');
      }
      
      return {
        idToken: retryResponse.AuthenticationResult.IdToken,
        accessToken: retryResponse.AuthenticationResult.AccessToken,
        refreshToken: retryResponse.AuthenticationResult.RefreshToken,
        expiresIn: retryResponse.AuthenticationResult.ExpiresIn,
      };
    }
    
    throw err;
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Magic Link Verify:', JSON.stringify(event, null, 2));

  try {
    // Get token from query string or body
    const token = event.queryStringParameters?.token || 
                  (event.body ? JSON.parse(event.body).token : null);

    if (!token) {
      return createResponse(400, {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Token is required' }
      });
    }

    // Validate token in database
    console.log('Searching for token:', token);
    const result = await query(
      'SELECT * FROM magic_link_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );

    console.log('Query result:', {
      rowCount: result.rows.length,
      foundToken: result.rows.length > 0,
    });

    if (result.rows.length === 0) {
      return createResponse(401, {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      });
    }

    const tokenData = result.rows[0];
    const email = tokenData.email;

    // Mark token as used
    await query(
      'UPDATE magic_link_tokens SET used = true WHERE id = $1',
      [tokenData.id]
    );

    // Get or create Cognito user
    console.log('Creating/fetching Cognito user for email:', email);
    const { username, sub, isNew: isNewCognitoUser } = await getOrCreateCognitoUser(email);
    console.log('Cognito user result:', { username, sub, isNew: isNewCognitoUser });

    // Check if user exists in our database
    console.log('Checking if user exists in database...');
    const userResult = await query(
      'SELECT * FROM users WHERE cognito_sub = $1 OR email = $2',
      [sub, email]
    );
    console.log('Database user query result:', { rowCount: userResult.rows.length });

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // Create new user in our database
      const userId = crypto.randomUUID();
      const displayName = email.split('@')[0]; // Use email prefix as initial display name
      
      const insertResult = await query(
        `INSERT INTO users (id, cognito_sub, email, username, display_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [userId, sub, email, username, displayName]
      );
      
      user = insertResult.rows[0];
      isNewUser = true;
    } else {
      user = userResult.rows[0];
      
      // Update cognito_sub if it's incorrect (migration fix)
      if (user.cognito_sub !== sub) {
        await query(
          'UPDATE users SET cognito_sub = $1, updated_at = NOW() WHERE id = $2',
          [sub, user.id]
        );
        user.cognito_sub = sub;
      }
    }

    // Generate session info
    console.log('Generating Cognito tokens...');
    const sessionData = await generateCognitoTokens(username);
    console.log('Tokens generated successfully');

    console.log('Verification complete, sending success response');
    return createResponse(isNewUser ? 201 : 200, {
      success: true,
      data: {
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.display_name,
          avatarUrl: user.avatar_url || null,
        },
        isNewUser,
        cognitoUsername: username,
        // JWT tokens for authenticated API requests
        tokens: {
          idToken: sessionData.idToken,
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          expiresIn: sessionData.expiresIn,
        },
      }
    });

  } catch (err: any) {
    console.error('CRITICAL ERROR in magic link verify:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return createResponse(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' }
    });
  }
};

