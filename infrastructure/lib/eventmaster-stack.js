"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMasterStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const path = __importStar(require("path"));
class EventMasterStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
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
        // 4. Cognito User Pool
        const userPool = new cognito.UserPool(this, 'EventMasterUserPool', {
            userPoolName: `eventmaster-users-${environment}`,
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool,
            userPoolClientName: `eventmaster-client-${environment}`,
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
            generateSecret: false,
        });
        // 5. SES (Email) - Nota: Requiere verificación manual del email
        const verifiedEmail = `noreply@eventmasterwl.com`;
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
        // Resolver ruta del backend (desde el directorio raíz del proyecto)
        // __dirname apunta a infrastructure/lib, necesitamos ir a events/
        const projectRoot = path.resolve(__dirname, '../..');
        const backendPath = path.join(projectRoot, 'backend/src/functions');
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
exports.EventMasterStack = EventMasterStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRtYXN0ZXItc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJldmVudG1hc3Rlci1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdUVBQXlEO0FBQ3pELCtEQUFpRDtBQUNqRCw0RUFBOEQ7QUFDOUQseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx1REFBeUM7QUFDekMsaUVBQW1EO0FBQ25ELHlEQUEyQztBQUMzQyx5REFBMkM7QUFFM0MsMkNBQTZCO0FBTzdCLE1BQWEsZ0JBQWlCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJN0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE0QjtRQUNwRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTlCLFNBQVM7UUFDVCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzlDLE1BQU0sRUFBRSxDQUFDO1lBQ1QsV0FBVyxFQUFFLFdBQVcsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM1QyxDQUFDLENBQUM7UUFFSCwrQkFBK0I7UUFDL0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUMvRCxNQUFNLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQztnQkFDMUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNO2FBQzFDLENBQUM7WUFDRixZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQy9CLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFB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cm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGxhbWJkYU5vZGVqcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqcyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRNYXN0ZXJTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRXZlbnRNYXN0ZXJTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IGF1dGhvcml6ZXI6IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXI7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEV2ZW50TWFzdGVyU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCB9ID0gcHJvcHM7XG5cbiAgICAvLyAxLiBWUENcbiAgICBjb25zdCB2cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnRXZlbnRNYXN0ZXJWUEMnLCB7XG4gICAgICBtYXhBenM6IDIsXG4gICAgICBuYXRHYXRld2F5czogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDIgOiAxLFxuICAgIH0pO1xuXG4gICAgLy8gMi4gRGF0YWJhc2UgKFJEUyBQb3N0Z3JlU1FMKVxuICAgIGNvbnN0IGRhdGFiYXNlID0gbmV3IHJkcy5EYXRhYmFzZUluc3RhbmNlKHRoaXMsICdFdmVudE1hc3RlckRCJywge1xuICAgICAgZW5naW5lOiByZHMuRGF0YWJhc2VJbnN0YW5jZUVuZ2luZS5wb3N0Z3Jlcyh7XG4gICAgICAgIHZlcnNpb246IHJkcy5Qb3N0Z3Jlc0VuZ2luZVZlcnNpb24uVkVSXzE1LFxuICAgICAgfSksXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoXG4gICAgICAgIGVjMi5JbnN0YW5jZUNsYXNzLlQzLFxuICAgICAgICBlYzIuSW5zdGFuY2VTaXplLk1JQ1JPXG4gICAgICApLFxuICAgICAgdnBjLFxuICAgICAgZGF0YWJhc2VOYW1lOiAnZXZlbnRtYXN0ZXInLFxuICAgICAgbXVsdGlBejogZW52aXJvbm1lbnQgPT09ICdwcm9kJyxcbiAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDIwLFxuICAgICAgbWF4QWxsb2NhdGVkU3RvcmFnZTogMTAwLFxuICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLFxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIDMuIFMzIEJ1Y2tldHNcbiAgICBjb25zdCBpbWFnZXNCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdJbWFnZXNCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgZXZlbnRtYXN0ZXItaW1hZ2VzLSR7ZW52aXJvbm1lbnR9LSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICByZW1vdmFsUG9saWN5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnIFxuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiBcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcXJDb2Rlc0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1FSQ29kZXNCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgZXZlbnRtYXN0ZXItcXJjb2Rlcy0ke2Vudmlyb25tZW50fS0ke3RoaXMuYWNjb3VudH1gLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIDQuIENvZ25pdG8gVXNlciBQb29sXG4gICAgY29uc3QgdXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnRXZlbnRNYXN0ZXJVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYGV2ZW50bWFzdGVyLXVzZXJzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgc2lnbkluQWxpYXNlczogeyBlbWFpbDogdHJ1ZSB9LFxuICAgICAgYXV0b1ZlcmlmeTogeyBlbWFpbDogdHJ1ZSB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyBcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ1VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2wsXG4gICAgICB1c2VyUG9vbENsaWVudE5hbWU6IGBldmVudG1hc3Rlci1jbGllbnQtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsXG4gICAgfSk7XG5cbiAgICAvLyA1LiBTRVMgKEVtYWlsKSAtIE5vdGE6IFJlcXVpZXJlIHZlcmlmaWNhY2nDs24gbWFudWFsIGRlbCBlbWFpbFxuICAgIGNvbnN0IHZlcmlmaWVkRW1haWwgPSBgbm9yZXBseUBldmVudG1hc3RlcndsLmNvbWA7XG5cbiAgICAvLyA2LiBTTlMgVG9waWMgcGFyYSBTTVNcbiAgICBjb25zdCBzbXNUb3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ1NNU1RvcGljJywge1xuICAgICAgdG9waWNOYW1lOiBgZXZlbnRtYXN0ZXItc21zLSR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcblxuICAgIC8vIDcuIExhbWJkYSBGdW5jdGlvbnNcbiAgICBjb25zdCBjb21tb25FbnYgPSB7XG4gICAgICBFTlZJUk9OTUVOVDogZW52aXJvbm1lbnQsXG4gICAgICBEQl9TRUNSRVRfQVJOOiBkYXRhYmFzZS5zZWNyZXQ/LnNlY3JldEFybiB8fCAnJyxcbiAgICAgIElNQUdFU19CVUNLRVQ6IGltYWdlc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgUVJfQ09ERVNfQlVDS0VUOiBxckNvZGVzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBVU0VSX1BPT0xfQ0xJRU5UX0lEOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgRlJPTV9FTUFJTDogdmVyaWZpZWRFbWFpbCxcbiAgICAgIFNNU19UT1BJQ19BUk46IHNtc1RvcGljLnRvcGljQXJuLFxuICAgIH07XG5cbiAgICAvLyBSZXNvbHZlciBydXRhIGRlbCBiYWNrZW5kIChkZXNkZSBlbCBkaXJlY3RvcmlvIHJhw616IGRlbCBwcm95ZWN0bylcbiAgICAvLyBfX2Rpcm5hbWUgYXB1bnRhIGEgaW5mcmFzdHJ1Y3R1cmUvbGliLCBuZWNlc2l0YW1vcyBpciBhIGV2ZW50cy9cbiAgICBjb25zdCBwcm9qZWN0Um9vdCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLicpO1xuICAgIGNvbnN0IGJhY2tlbmRQYXRoID0gcGF0aC5qb2luKHByb2plY3RSb290LCAnYmFja2VuZC9zcmMvZnVuY3Rpb25zJyk7XG4gICAgXG4gICAgY29uc3QgbGFtYmRhRGVmYXVsdHMgPSB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIHZwYyxcbiAgICAgIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX0VHUkVTUyB9LFxuICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogWydhd3Mtc2RrJ10sXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy8gVGVuYW50IEhhbmRsZXJcbiAgICBjb25zdCB0ZW5hbnRIYW5kbGVyID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnVGVuYW50SGFuZGxlcicsIHtcbiAgICAgIC4uLmxhbWJkYURlZmF1bHRzLFxuICAgICAgZW50cnk6IHBhdGguam9pbihiYWNrZW5kUGF0aCwgJ3RlbmFudC9pbmRleC50cycpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgZXZlbnRtYXN0ZXItdGVuYW50LSR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcbiAgICBkYXRhYmFzZS5zZWNyZXQ/LmdyYW50UmVhZCh0ZW5hbnRIYW5kbGVyKTtcbiAgICBpbWFnZXNCdWNrZXQuZ3JhbnRSZWFkV3JpdGUodGVuYW50SGFuZGxlcik7XG5cbiAgICAvLyBFdmVudHMgSGFuZGxlclxuICAgIGNvbnN0IGV2ZW50c0hhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdFdmVudHNIYW5kbGVyJywge1xuICAgICAgLi4ubGFtYmRhRGVmYXVsdHMsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKGJhY2tlbmRQYXRoLCAnZXZlbnRzL2luZGV4LnRzJyksXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBldmVudG1hc3Rlci1ldmVudHMtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuICAgIGRhdGFiYXNlLnNlY3JldD8uZ3JhbnRSZWFkKGV2ZW50c0hhbmRsZXIpO1xuICAgIGltYWdlc0J1Y2tldC5ncmFudFJlYWRXcml0ZShldmVudHNIYW5kbGVyKTtcblxuICAgIC8vIFBhcnRpY2lwYW50cyBIYW5kbGVyXG4gICAgY29uc3QgcGFydGljaXBhbnRzSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1BhcnRpY2lwYW50c0hhbmRsZXInLCB7XG4gICAgICAuLi5sYW1iZGFEZWZhdWx0cyxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oYmFja2VuZFBhdGgsICdwYXJ0aWNpcGFudHMvaW5kZXgudHMnKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGV2ZW50bWFzdGVyLXBhcnRpY2lwYW50cy0ke2Vudmlyb25tZW50fWAsXG4gICAgfSk7XG4gICAgZGF0YWJhc2Uuc2VjcmV0Py5ncmFudFJlYWQocGFydGljaXBhbnRzSGFuZGxlcik7XG4gICAgcXJDb2Rlc0J1Y2tldC5ncmFudFJlYWRXcml0ZShwYXJ0aWNpcGFudHNIYW5kbGVyKTtcbiAgICBwYXJ0aWNpcGFudHNIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3NlczpTZW5kRW1haWwnLCAnc2VzOlNlbmRSYXdFbWFpbCddLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBDaGVjay1pbiBIYW5kbGVyXG4gICAgY29uc3QgY2hlY2tpbkhhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdDaGVja2luSGFuZGxlcicsIHtcbiAgICAgIC4uLmxhbWJkYURlZmF1bHRzLFxuICAgICAgZW50cnk6IHBhdGguam9pbihiYWNrZW5kUGF0aCwgJ2NoZWNraW4vaW5kZXgudHMnKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGV2ZW50bWFzdGVyLWNoZWNraW4tJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuICAgIGRhdGFiYXNlLnNlY3JldD8uZ3JhbnRSZWFkKGNoZWNraW5IYW5kbGVyKTtcblxuICAgIC8vIEVtYWlsIEhhbmRsZXJcbiAgICBjb25zdCBlbWFpbEhhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdFbWFpbEhhbmRsZXInLCB7XG4gICAgICAuLi5sYW1iZGFEZWZhdWx0cyxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oYmFja2VuZFBhdGgsICdlbWFpbC9pbmRleC50cycpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgZXZlbnRtYXN0ZXItZW1haWwtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuICAgIGRhdGFiYXNlLnNlY3JldD8uZ3JhbnRSZWFkKGVtYWlsSGFuZGxlcik7XG4gICAgZW1haWxIYW5kbGVyLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbJ3NlczpTZW5kRW1haWwnLCAnc2VzOlNlbmRSYXdFbWFpbCddLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBTTVMgSGFuZGxlclxuICAgIGNvbnN0IHNtc0hhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdTTVNIYW5kbGVyJywge1xuICAgICAgLi4ubGFtYmRhRGVmYXVsdHMsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKGJhY2tlbmRQYXRoLCAnc21zL2luZGV4LnRzJyksXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBldmVudG1hc3Rlci1zbXMtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuICAgIGRhdGFiYXNlLnNlY3JldD8uZ3JhbnRSZWFkKHNtc0hhbmRsZXIpO1xuICAgIHNtc1RvcGljLmdyYW50UHVibGlzaChzbXNIYW5kbGVyKTtcblxuICAgIC8vIFdhbGxldCBIYW5kbGVyXG4gICAgY29uc3Qgd2FsbGV0SGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1dhbGxldEhhbmRsZXInLCB7XG4gICAgICAuLi5sYW1iZGFEZWZhdWx0cyxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oYmFja2VuZFBhdGgsICd3YWxsZXQvaW5kZXgudHMnKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGV2ZW50bWFzdGVyLXdhbGxldC0ke2Vudmlyb25tZW50fWAsXG4gICAgfSk7XG4gICAgZGF0YWJhc2Uuc2VjcmV0Py5ncmFudFJlYWQod2FsbGV0SGFuZGxlcik7XG5cbiAgICAvLyBQdWJsaWMgSGFuZGxlciAoc2luIGF1dGgpXG4gICAgY29uc3QgcHVibGljSGFuZGxlciA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1B1YmxpY0hhbmRsZXInLCB7XG4gICAgICAuLi5sYW1iZGFEZWZhdWx0cyxcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oYmFja2VuZFBhdGgsICdwdWJsaWMvaW5kZXgudHMnKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGV2ZW50bWFzdGVyLXB1YmxpYy0ke2Vudmlyb25tZW50fWAsXG4gICAgfSk7XG4gICAgZGF0YWJhc2Uuc2VjcmV0Py5ncmFudFJlYWQocHVibGljSGFuZGxlcik7XG5cbiAgICAvLyBBbmFseXRpY3MgSGFuZGxlclxuICAgIGNvbnN0IGFuYWx5dGljc0hhbmRsZXIgPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdBbmFseXRpY3NIYW5kbGVyJywge1xuICAgICAgLi4ubGFtYmRhRGVmYXVsdHMsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKGJhY2tlbmRQYXRoLCAnYW5hbHl0aWNzL2luZGV4LnRzJyksXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBmdW5jdGlvbk5hbWU6IGBldmVudG1hc3Rlci1hbmFseXRpY3MtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuICAgIGRhdGFiYXNlLnNlY3JldD8uZ3JhbnRSZWFkKGFuYWx5dGljc0hhbmRsZXIpO1xuXG4gICAgLy8gOC4gQVBJIEdhdGV3YXlcbiAgICB0aGlzLmFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0V2ZW50TWFzdGVyQVBJJywge1xuICAgICAgcmVzdEFwaU5hbWU6IGBldmVudG1hc3Rlci1hcGktJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6IGVudmlyb25tZW50LFxuICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiAxMDAsXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAyMDAsXG4gICAgICB9LFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0F1dGhvcml6ZXInLCB7XG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbdXNlclBvb2xdLFxuICAgICAgYXV0aG9yaXplck5hbWU6ICdDb2duaXRvQXV0aG9yaXplcicsXG4gICAgfSk7XG5cbiAgICAvLyA5LiBSb3V0ZXNcbiAgICBjb25zdCB0ZW5hbnRSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3RlbmFudCcpO1xuICAgIHRlbmFudFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGVuYW50SGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICB0ZW5hbnRSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRlbmFudEhhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgdGVuYW50UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2JyYW5kaW5nJykuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0ZW5hbnRIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuICAgIHRlbmFudFJlc291cmNlLmFkZFJlc291cmNlKCd1cGRhdGVCcmFuZGluZycpLmFkZE1ldGhvZCgnUFVUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGVuYW50SGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICB0ZW5hbnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY3JlYXRlJykuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGVuYW50SGFuZGxlcikpO1xuXG4gICAgY29uc3QgZXZlbnRzUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdldmVudHMnKTtcbiAgICBldmVudHNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGV2ZW50c0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgZXZlbnRzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZXZlbnRzSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IGV2ZW50UmVzb3VyY2UgPSBldmVudHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2V2ZW50SWR9Jyk7XG4gICAgZXZlbnRSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGV2ZW50c0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgZXZlbnRSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGV2ZW50c0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgZXZlbnRSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGV2ZW50c0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgZXZlbnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgncHVibGlzaCcpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGV2ZW50c0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwYXJ0aWNpcGFudHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3BhcnRpY2lwYW50cycpO1xuICAgIHBhcnRpY2lwYW50c1Jlc291cmNlLmFkZFJlc291cmNlKCdyZWdpc3RlcicpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHBhcnRpY2lwYW50c0hhbmRsZXIpKTtcbiAgICBwYXJ0aWNpcGFudHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc2VuZFFSJykuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocGFydGljaXBhbnRzSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBwYXJ0aWNpcGFudHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3BhcnRpY2lwYW50SWR9JykuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihwYXJ0aWNpcGFudHNIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIFBhcnRpY2lwYW50cyBwb3IgZXZlbnRvOiAvZXZlbnRzL3tldmVudElkfS9wYXJ0aWNpcGFudHNcbiAgICBldmVudFJlc291cmNlLmFkZFJlc291cmNlKCdwYXJ0aWNpcGFudHMnKS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHBhcnRpY2lwYW50c0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjaGVja2luUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdjaGVja2luJyk7XG4gICAgY2hlY2tpblJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNoZWNraW5IYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZW1haWxSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2VtYWlsJyk7XG4gICAgZW1haWxSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc2VuZCcpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGVtYWlsSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHNtc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnc21zJyk7XG4gICAgc21zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3NlbmQnKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihzbXNIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgd2FsbGV0UmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCd3YWxsZXQnKTtcbiAgICB3YWxsZXRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZ2VuZXJhdGUnKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih3YWxsZXRIYW5kbGVyKSwge1xuICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxuICAgIH0pO1xuICAgIHdhbGxldFJlc291cmNlLmFkZFJlc291cmNlKCdhcHBsZScpLmFkZFJlc291cmNlKCd7cGFydGljaXBhbnRJZH0nKS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHdhbGxldEhhbmRsZXIpKTtcbiAgICB3YWxsZXRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZ29vZ2xlJykuYWRkUmVzb3VyY2UoJ3twYXJ0aWNpcGFudElkfScpLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24od2FsbGV0SGFuZGxlcikpO1xuXG4gICAgY29uc3QgcHVibGljUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdwdWJsaWMnKTtcbiAgICBjb25zdCBwdWJsaWNFdmVudHNSZXNvdXJjZSA9IHB1YmxpY1Jlc291cmNlLmFkZFJlc291cmNlKCdldmVudHMnKTtcbiAgICBjb25zdCBwdWJsaWNFdmVudFJlc291cmNlID0gcHVibGljRXZlbnRzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3t0ZW5hbnRTbHVnfScpLmFkZFJlc291cmNlKCd7ZXZlbnRTbHVnfScpO1xuICAgIHB1YmxpY0V2ZW50UmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihwdWJsaWNIYW5kbGVyKSk7XG5cbiAgICBjb25zdCBkYXNoYm9hcmRSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2Rhc2hib2FyZCcpO1xuICAgIGRhc2hib2FyZFJlc291cmNlLmFkZFJlc291cmNlKCdzdGF0cycpLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYW5hbHl0aWNzSGFuZGxlciksIHtcbiAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IGFuYWx5dGljc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYW5hbHl0aWNzJyk7XG4gICAgYW5hbHl0aWNzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2V2ZW50cycpLmFkZFJlc291cmNlKCd7ZXZlbnRJZH0nKS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFuYWx5dGljc0hhbmRsZXIpLCB7XG4gICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBJRCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSUQnLFxuICAgIH0pO1xuICB9XG59XG5cbiJdfQ==