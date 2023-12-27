// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface RaeCdkCommonLibProps {
  // Define construct properties here
}

export class RaeCdkCommonLib extends Construct {

  constructor(scope: Construct, id: string, props: RaeCdkCommonLibProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'RaeCdkCommonLibQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
