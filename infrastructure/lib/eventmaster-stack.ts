import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

export interface EventMasterStackProps extends cdk.StackProps {
  environment: string;
}

export class EventMasterStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: EventMasterStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // 1. VPC
    const vpc = new ec2.Vpc(this, 'EventMasterVPC', {
      maxAzs: 2,
      natGateways: environment === 'prod' ? 2 : 1,
    });

    // 2. Database (RDS PostgreSQL)
    const database = new rds.DatabaseInstance(this, 'EventMasterDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      databaseName: 'eventmaster',
      multiAz: environment === 'prod',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deletionProtection: environment === 'prod',
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // 3. S3 Buckets
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `eventmaster-images-${environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    const qrCodesBucket = new s3.Bucket(this, 'QRCodesBucket', {
      bucketName: `eventmaster-qrcodes-${environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // 4. SES (Email) - Definir antes de usarlo
    const verifiedEmail = `noreply@hernandezmediaevents.com`;

    // 5. Cognito User Pool con Magic Link
    // Resolver ruta del backend (desde el directorio raíz del proyecto)
    const projectRoot = path.resolve(__dirname, '../..');
    const backendPath = path.join(projectRoot, 'backend/src/functions');
    
    // Lambda functions para custom auth flow
    const defineAuthChallengeLambda = new lambdaNodejs.NodejsFunction(this, 'DefineAuthChallengeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(backendPath, 'auth/define-auth-challenge.ts'),
      handler: 'handler',
      functionName: `eventmaster-define-auth-challenge-${environment}`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const createAuthChallengeLambda = new lambdaNodejs.NodejsFunction(this, 'CreateAuthChallengeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(backendPath, 'auth/create-auth-challenge.ts'),
      handler: 'handler',
      functionName: `eventmaster-create-auth-challenge-${environment}`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        FROM_EMAIL: verifiedEmail,
        FRONTEND_URL: environment === 'prod' 
          ? 'https://your-domain.com' // TODO: Actualizar con dominio real
          : 'http://localhost:3000',
      },
    });

    // Dar permisos a SES para enviar emails
    createAuthChallengeLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    const verifyAuthChallengeLambda = new lambdaNodejs.NodejsFunction(this, 'VerifyAuthChallengeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(backendPath, 'auth/verify-auth-challenge.ts'),
      handler: 'handler',
      functionName: `eventmaster-verify-auth-challenge-${environment}`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const preSignUpLambda = new lambdaNodejs.NodejsFunction(this, 'PreSignUpLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(backendPath, 'auth/pre-signup.ts'),
      handler: 'handler',
      functionName: `eventmaster-pre-signup-${environment}`,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        DB_SECRET_ARN: database.secret?.secretArn || '',
      },
    });

    // Dar permisos a Cognito y RDS
    preSignUpLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminGetUser'],
        resources: ['*'],
      })
    );
    database.secret?.grantRead(preSignUpLambda);

    const userPool = new cognito.UserPool(this, 'EventMasterUserPool', {
      userPoolName: `eventmaster-users-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      // Remover password policy ya que usamos magic link
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      // Lambda triggers para magic link
      lambdaTriggers: {
        preSignUp: preSignUpLambda,
        defineAuthChallenge: defineAuthChallengeLambda,
        createAuthChallenge: createAuthChallengeLambda,
        verifyAuthChallenge: verifyAuthChallengeLambda,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: `eventmaster-client-${environment}`,
      authFlows: {
        custom: true, // Habilitar custom auth flow para magic link
        userSrp: true, // Mantener SRP para compatibilidad
      },
      generateSecret: false,
    });

    // 6. SNS Topic para SMS
    const smsTopic = new sns.Topic(this, 'SMSTopic', {
      topicName: `eventmaster-sms-${environment}`,
    });

    // 7. Lambda Functions
    const commonEnv = {
      ENVIRONMENT: environment,
      DB_SECRET_ARN: database.secret?.secretArn || '',
      IMAGES_BUCKET: imagesBucket.bucketName,
      QR_CODES_BUCKET: qrCodesBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      FROM_EMAIL: verifiedEmail,
      SMS_TOPIC_ARN: smsTopic.topicArn,
    };

    // backendPath ya está definido arriba
    
    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
    };

    // Tenant Handler
    const tenantHandler = new lambdaNodejs.NodejsFunction(this, 'TenantHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'tenant/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-tenant-${environment}`,
    });
    database.secret?.grantRead(tenantHandler);
    imagesBucket.grantReadWrite(tenantHandler);

    // Events Handler
    const eventsHandler = new lambdaNodejs.NodejsFunction(this, 'EventsHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'events/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-events-${environment}`,
    });
    database.secret?.grantRead(eventsHandler);
    imagesBucket.grantReadWrite(eventsHandler);

    // Participants Handler
    const participantsHandler = new lambdaNodejs.NodejsFunction(this, 'ParticipantsHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'participants/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-participants-${environment}`,
    });
    database.secret?.grantRead(participantsHandler);
    qrCodesBucket.grantReadWrite(participantsHandler);
    participantsHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // Check-in Handler
    const checkinHandler = new lambdaNodejs.NodejsFunction(this, 'CheckinHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'checkin/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-checkin-${environment}`,
    });
    database.secret?.grantRead(checkinHandler);

    // Email Handler
    const emailHandler = new lambdaNodejs.NodejsFunction(this, 'EmailHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'email/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-email-${environment}`,
    });
    database.secret?.grantRead(emailHandler);
    emailHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // SMS Handler
    const smsHandler = new lambdaNodejs.NodejsFunction(this, 'SMSHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'sms/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-sms-${environment}`,
    });
    database.secret?.grantRead(smsHandler);
    smsTopic.grantPublish(smsHandler);

    // Wallet Handler
    const walletHandler = new lambdaNodejs.NodejsFunction(this, 'WalletHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'wallet/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-wallet-${environment}`,
    });
    database.secret?.grantRead(walletHandler);

    // Public Handler (sin auth)
    const publicHandler = new lambdaNodejs.NodejsFunction(this, 'PublicHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'public/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-public-${environment}`,
    });
    database.secret?.grantRead(publicHandler);

    // Analytics Handler
    const analyticsHandler = new lambdaNodejs.NodejsFunction(this, 'AnalyticsHandler', {
      ...lambdaDefaults,
      entry: path.join(backendPath, 'analytics/index.ts'),
      handler: 'handler',
      functionName: `eventmaster-analytics-${environment}`,
    });
    database.secret?.grantRead(analyticsHandler);

    // 8. API Gateway
    this.api = new apigateway.RestApi(this, 'EventMasterAPI', {
      restApiName: `eventmaster-api-${environment}`,
      deployOptions: {
        stageName: environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'CognitoAuthorizer',
    });

    // 9. Routes
    const tenantResource = this.api.root.addResource('tenant');
    tenantResource.addMethod('GET', new apigateway.LambdaIntegration(tenantHandler), {
      authorizer: this.authorizer,
    });
    tenantResource.addMethod('PUT', new apigateway.LambdaIntegration(tenantHandler), {
      authorizer: this.authorizer,
    });
    tenantResource.addResource('branding').addMethod('GET', new apigateway.LambdaIntegration(tenantHandler), {
      authorizer: this.authorizer,
    });
    tenantResource.addResource('updateBranding').addMethod('PUT', new apigateway.LambdaIntegration(tenantHandler), {
      authorizer: this.authorizer,
    });
    tenantResource.addResource('create').addMethod('POST', new apigateway.LambdaIntegration(tenantHandler));

    const eventsResource = this.api.root.addResource('events');
    eventsResource.addMethod('GET', new apigateway.LambdaIntegration(eventsHandler), {
      authorizer: this.authorizer,
    });
    eventsResource.addMethod('POST', new apigateway.LambdaIntegration(eventsHandler), {
      authorizer: this.authorizer,
    });

    const eventResource = eventsResource.addResource('{eventId}');
    eventResource.addMethod('GET', new apigateway.LambdaIntegration(eventsHandler), {
      authorizer: this.authorizer,
    });
    eventResource.addMethod('PUT', new apigateway.LambdaIntegration(eventsHandler), {
      authorizer: this.authorizer,
    });
    eventResource.addMethod('DELETE', new apigateway.LambdaIntegration(eventsHandler), {
      authorizer: this.authorizer,
    });
    eventResource.addResource('publish').addMethod('POST', new apigateway.LambdaIntegration(eventsHandler), {
      authorizer: this.authorizer,
    });

    const participantsResource = this.api.root.addResource('participants');
    participantsResource.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(participantsHandler));
    participantsResource.addResource('sendQR').addMethod('POST', new apigateway.LambdaIntegration(participantsHandler), {
      authorizer: this.authorizer,
    });
    participantsResource.addResource('{participantId}').addMethod('GET', new apigateway.LambdaIntegration(participantsHandler), {
      authorizer: this.authorizer,
    });
    
    // Participants por evento: /events/{eventId}/participants
    eventResource.addResource('participants').addMethod('GET', new apigateway.LambdaIntegration(participantsHandler), {
      authorizer: this.authorizer,
    });

    const checkinResource = this.api.root.addResource('checkin');
    checkinResource.addMethod('POST', new apigateway.LambdaIntegration(checkinHandler), {
      authorizer: this.authorizer,
    });

    const emailResource = this.api.root.addResource('email');
    emailResource.addResource('send').addMethod('POST', new apigateway.LambdaIntegration(emailHandler), {
      authorizer: this.authorizer,
    });

    const smsResource = this.api.root.addResource('sms');
    smsResource.addResource('send').addMethod('POST', new apigateway.LambdaIntegration(smsHandler), {
      authorizer: this.authorizer,
    });

    const walletResource = this.api.root.addResource('wallet');
    walletResource.addResource('generate').addMethod('POST', new apigateway.LambdaIntegration(walletHandler), {
      authorizer: this.authorizer,
    });
    walletResource.addResource('apple').addResource('{participantId}').addMethod('GET', new apigateway.LambdaIntegration(walletHandler));
    walletResource.addResource('google').addResource('{participantId}').addMethod('GET', new apigateway.LambdaIntegration(walletHandler));

    const publicResource = this.api.root.addResource('public');
    const publicEventsResource = publicResource.addResource('events');
    const publicEventResource = publicEventsResource.addResource('{tenantSlug}').addResource('{eventSlug}');
    publicEventResource.addMethod('GET', new apigateway.LambdaIntegration(publicHandler));

    const dashboardResource = this.api.root.addResource('dashboard');
    dashboardResource.addResource('stats').addMethod('GET', new apigateway.LambdaIntegration(analyticsHandler), {
      authorizer: this.authorizer,
    });

    const analyticsResource = this.api.root.addResource('analytics');
    analyticsResource.addResource('events').addResource('{eventId}').addMethod('GET', new apigateway.LambdaIntegration(analyticsHandler), {
      authorizer: this.authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
  }
}

