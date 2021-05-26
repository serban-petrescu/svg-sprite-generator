#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PocStack } from '../lib/poc-stack';

const app = new cdk.App();

const env: cdk.Environment = {
    account: '840197697825',
    region: 'eu-central-1',
};

new PocStack(app, 'PocSvgIcons', { env });
