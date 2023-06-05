const subLink = 'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/sub_merge.txt';

const fetch = async (request) => {
  let url = new URL(request.url);
  let realhostname = url.pathname.split('/')[1];
  let realpathname = url.pathname.split('/')[2];
  if (url.pathname.startsWith('/sub')) {
    let newConfigs = '';
    let resp = await fetch(subLink);
    let subConfigs = await resp.text();
    subConfigs = subConfigs.split('\n');
    for (let subConfig of subConfigs) {
      if (subConfig.search('vmess') != -1) {
        subConfig = subConfig.replace('vmess://', '');
        subConfig = atob(subConfig);
        subConfig = JSON.parse(subConfig);
        if (subConfig.sni && !isIp(subConfig.sni) && subConfig.net == 'ws' && subConfig.port == 443) {
          var configNew = new Object();
          configNew.v = '2';
          configNew.ps = 'Node-' + subConfig.sni;
          if (realpathname == '') {
            configNew.add = url.hostname;
          } else {
            configNew.add = realpathname;
          }
          configNew.port = subConfig.port;
          configNew.id = subConfig.id;
          configNew.net = subConfig.net;
          configNew.host = url.hostname;
          configNew.path = '/' + subConfig.sni + subConfig.path;
          configNew.tls = subConfig.tls;
          configNew.sni = url.hostname;
          configNew.aid = '0';
          configNew.scy = 'auto';
          configNew.type = 'auto';
          configNew.fp = 'chrome';
          configNew.alpn = 'http/1.1';
          configNew = 'vmess://' + btoa(JSON.stringify(configNew));
          newConfigs = newConfigs + configNew + '\n';
        }
      }
    }
    return generateClashSubscribeLink(newConfigs);
  } else {
    const url = new URL(request.url);
    const splitted = url.pathname.replace(/^\/*/, '').split('/');
    const address = splitted[0];
    url.pathname = splitted.slice(1).join('/');
    url.hostname = address;
    url.protocol = 'https';
    return fetch(new Request(url, request));
  }
};

function isIp(ipstr) {
  try {
    if (ipstr == "" || ipstr == undefined) return false;
    if (!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){2}\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-4])$/.test(ipstr)) {
      return false;
    }
    var ls = ipstr.split('.');
    if (ls == null || ls.length != 4 || ls[3] == "0" || parseInt(ls[3]) === 0) {
      return false;
    }
    return true;
  } catch (ee) {}
  return false;
}

function decodeVmessLink(link) {
  const decodedStr = new TextDecoder('utf-8').decode(new Uint8Array(atob(link.split('://')[1]).match(/[\s\S]/g).map(ch => ch.charCodeAt(0))));
  return JSON.parse(decodedStr);
}

function inClashForm(d, i) {
  return `- name: ${d['ps']}${i}
  server: ${d['host']}
  port: ${d['port']}
  type: vmess
  uuid: ${d['id']}
  alterId: ${d['aid'] || '0'}
  cipher: ${d['scy'] || 'auto'}
  tls: true
  sni: ${d['sni']}
  alpn: http/1.1
  skip-cert-verify: false
  network: ws
  ws-opts:
    path: ${d['path']}
    headers:
      Host: ${d['host']}`;
}

function getNames(q, i) {
  return `  - ${q['ps']}${i}`;
}

function generateClashSubscribeLink(links) {
  const result = `port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: silent
external-controller: 127.0.0.1:9090
proxies:
`;
  const splittedLinks = links.split('\n');
  const decodedLinks = [];
  const t = `
proxy-groups:
- name: global
  type: select
  proxies:
`;
  splittedLinks.forEach((link) => {
    const vmessLink = link.trim();
    if (vmessLink.startsWith('vmess://')) {
      decodedLinks.push(decodeVmessLink(vmessLink));
    }
  });
  return `${result}${decodedLinks.map((item, index) => inClashForm(item, index)).join('\n')}${t}${decodedLinks.map((item, index) => getNames(item, index)).join('\n')}`;
}

fetch(request);
