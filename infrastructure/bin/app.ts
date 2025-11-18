#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventMasterStack } from '../lib/eventmaster-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';

new EventMasterStack(app, `EventMasterStack-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});


