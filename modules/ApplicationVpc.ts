import { Vpc } from "../.gen/modules/vpc";
import { Construct } from "constructs";

interface VpcConfig {
    securityGroupName: string;
    name: string,
    cidr: string,
    azs: string[],
    privateSubnets: string[],
    publicSubnets: string[],
    databaseSubnets: string[]
};

export class ApplicationVpc extends Construct {
    constructor(scope: Construct, id: string, options: VpcConfig) {
        super(scope, id);
        const privateSubnets = options.privateSubnets;
        const publicSubnets = options.publicSubnets;
        const databaseSubnets = options.databaseSubnets;

        new Vpc(this, 'MyVpc', {
            name: options.name,
            cidr: options.cidr,
            azs: options.azs,
            privateSubnets: privateSubnets,
            publicSubnets: publicSubnets,
            databaseSubnets: databaseSubnets,
            enableNatGateway: true,
            oneNatGatewayPerAz: true,
            defaultSecurityGroupName: options.securityGroupName,
            publicInboundAclRules: getPublicInboundAclRules(),
            publicOutboundAclRules: getPublicOutboundAclRules(),
            privateInboundAclRules: getPrivateInboundAclRules(publicSubnets, privateSubnets),
            privateOutboundAclRules: getPrivateOutboundAclRules(publicSubnets, privateSubnets, databaseSubnets),
            databaseInboundAclRules: getDatabaseInboundAclRules(publicSubnets, privateSubnets),
            databaseOutboundAclRules: getDatabaseOutboundAclRules(privateSubnets),
            createDatabaseSubnetRouteTable: true,
            defaultRouteTableName: 'Public Route table',
            publicAclTags: { 'Name': 'Public ACL' },
            privateAclTags: { 'Name': 'Private tier ACL' },
            databaseAclTags: { 'Name': 'Database ACL' },
        })
    }
}

function getPublicInboundAclRules(): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '80', '80', 'tcp', '0.0.0.0/0'),
        getAclRule('110', 'allow', '443', '443', 'tcp', '0.0.0.0/0'),
        getAclRule('120', 'allow', '22', '22', 'tcp', '0.0.0.0/0'),
    ]
}

function getPublicOutboundAclRules(): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '80', '80', 'tcp', '0.0.0.0/0'),
        getAclRule('110', 'allow', '443', '443', 'tcp', '0.0.0.0/0'),
        getAclRule('120', 'allow', '22', '22', 'tcp', '0.0.0.0/0'),
    ]
}

function getPrivateInboundAclRules(publicSubnets: string[], privateSubnets: string[]): { [key: string]: string; }[] {
    return [
        getAclRule('100', 'allow', '*', '*', '-1', privateSubnets[0]),
        getAclRule('110', 'allow', '*', '*', '-1', privateSubnets[1]),
        getAclRule('120', 'allow', '*', '*', '-1', publicSubnets[0]),
        getAclRule('130', 'allow', '*', '*', '-1', publicSubnets[1]),
    ]
}

function getAclRule(rule_number: string, rule_action: string, from_port: string, to_port: string, protocol: string, cidr_block: string): { [key: string]: string; } {
    return {
        'rule_number': rule_number,
        'rule_action': rule_action,
        'from_port': from_port,
        'to_port': to_port,
        'protocol': protocol,
        'cidr_block': cidr_block
    }
}

function getPrivateOutboundAclRules(publicSubnets: string[], privateSubnets: string[], databaseSubnets: string[]): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '*', '*', '-1', privateSubnets[0]),
        getAclRule('110', 'allow', '*', '*', '-1', privateSubnets[1]),
        getAclRule('120', 'allow', '*', '*', '-1', publicSubnets[0]),
        getAclRule('130', 'allow', '*', '*', '-1', publicSubnets[1]),
        getAclRule('140', 'allow', '*', '*', '-1', databaseSubnets[0]),
        getAclRule('150', 'allow', '*', '*', '-1', databaseSubnets[1]),
    ]
}

function getDatabaseInboundAclRules(publicSubnets: string[], privateSubnets: string[]): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'deny', '*', '*', '-1', publicSubnets[0]),
        getAclRule('110', 'deny', '*', '*', '-1', publicSubnets[1]),
        getAclRule('120', 'allow', '*', '*', '-1', privateSubnets[0]),
        getAclRule('130', 'allow', '*', '*', '-1', privateSubnets[1]),
    ]
}

function getDatabaseOutboundAclRules(privateSubnets: string[]): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '*', '*', '-1', privateSubnets[0]),
        getAclRule('110', 'allow', '*', '*', '-1', privateSubnets[1]),
    ]
}