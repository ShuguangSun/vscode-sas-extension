"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[1487],{8883:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>h,contentTitle:()=>a,default:()=>c,frontMatter:()=>r,metadata:()=>t,toc:()=>d});const t=JSON.parse('{"id":"Configurations/Profiles/sas9ssh","title":"SAS 9.4 (remote - SSH) Connection Profile","description":"This connection method uses SSH to authenticate to a SAS Server and run SAS Code using Interactive Line Mode. A number of methods are available to create a secure connection to the SAS 9.4 server.","source":"@site/docs/Configurations/Profiles/sas9ssh.md","sourceDirName":"Configurations/Profiles","slug":"/Configurations/Profiles/sas9ssh","permalink":"/vscode-sas-extension/Configurations/Profiles/sas9ssh","draft":false,"unlisted":false,"editUrl":"https://github.com/sassoftware/vscode-sas-extension/tree/main/website/docs/Configurations/Profiles/sas9ssh.md","tags":[],"version":"current","sidebarPosition":4,"frontMatter":{"sidebar_position":4},"sidebar":"defaultSidebar","previous":{"title":"SAS 9.4 (remote - IOM) Connection Profile","permalink":"/vscode-sas-extension/Configurations/Profiles/sas9iom"},"next":{"title":"Additional Profile Settings","permalink":"/vscode-sas-extension/Configurations/Profiles/additional"}}');var i=s(4848),o=s(8453);const r={sidebar_position:4},a="SAS 9.4 (remote - SSH) Connection Profile",h={},d=[{value:"Profile Anatomy",id:"profile-anatomy",level:2},{value:"Authenticating to a SAS Server",id:"authenticating-to-a-sas-server",level:2},{value:"Publickey",id:"publickey",level:3},{value:"SSH Agent",id:"ssh-agent",level:4},{value:"Windows",id:"windows",level:5},{value:"Mac",id:"mac",level:5},{value:"Private Key File Path",id:"private-key-file-path",level:4},{value:"Password",id:"password",level:3},{value:"Keyboard Interactive",id:"keyboard-interactive",level:3}];function l(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",header:"header",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"sas-94-remote---ssh-connection-profile",children:"SAS 9.4 (remote - SSH) Connection Profile"})}),"\n",(0,i.jsxs)(n.p,{children:["This connection method uses SSH to authenticate to a SAS Server and run SAS Code using ",(0,i.jsx)(n.a,{href:"https://go.documentation.sas.com/doc/en/pgmsascdc/9.4_3.5/hostunx/n16ui9f6dacn8pn1t0y2hgxgi7wa.htm",children:"Interactive Line Mode"}),". A number of methods are available to create a secure connection to the SAS 9.4 server."]}),"\n",(0,i.jsx)(n.admonition,{type:"note",children:(0,i.jsxs)(n.p,{children:["You can use the console log to help debug connection issues. For more information, see ",(0,i.jsx)(n.a,{href:"/vscode-sas-extension/faq#how-do-i-debug-connection-failures",children:"How do I debug connection failures?"})]})}),"\n",(0,i.jsx)(n.h2,{id:"profile-anatomy",children:"Profile Anatomy"}),"\n",(0,i.jsx)(n.p,{children:"A SAS 9.4 (remote \u2013 SSH) connection profile includes the following parameters:"}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.code,{children:'"connectionType": "ssh"'})}),"\n",(0,i.jsxs)(n.table,{children:[(0,i.jsx)(n.thead,{children:(0,i.jsxs)(n.tr,{children:[(0,i.jsx)(n.th,{children:"Name"}),(0,i.jsx)(n.th,{children:"Description"}),(0,i.jsx)(n.th,{children:"Additional Notes"})]})}),(0,i.jsxs)(n.tbody,{children:[(0,i.jsxs)(n.tr,{children:[(0,i.jsx)(n.td,{children:(0,i.jsx)(n.code,{children:"host"})}),(0,i.jsx)(n.td,{children:"SSH Server Host"}),(0,i.jsx)(n.td,{children:"Appears when hovering over the status bar."})]}),(0,i.jsxs)(n.tr,{children:[(0,i.jsx)(n.td,{children:(0,i.jsx)(n.code,{children:"username"})}),(0,i.jsx)(n.td,{children:"SSH Server Username"}),(0,i.jsx)(n.td,{children:"The username to establish the SSH connection to the server."})]}),(0,i.jsxs)(n.tr,{children:[(0,i.jsx)(n.td,{children:(0,i.jsx)(n.code,{children:"port"})}),(0,i.jsx)(n.td,{children:"SSH Server Port"}),(0,i.jsx)(n.td,{children:"The SSH port of the SSH server. The default value is 22."})]}),(0,i.jsxs)(n.tr,{children:[(0,i.jsx)(n.td,{children:(0,i.jsx)(n.code,{children:"saspath"})}),(0,i.jsx)(n.td,{children:"Path to SAS Executable on the server"}),(0,i.jsx)(n.td,{children:"Must be a fully qualified path on the SSH server to a SAS executable file."})]}),(0,i.jsxs)(n.tr,{children:[(0,i.jsx)(n.td,{children:(0,i.jsx)(n.code,{children:"privateKeyFilePath"})}),(0,i.jsx)(n.td,{children:"SSH Private Key File (optional)"}),(0,i.jsx)(n.td,{children:"Must be a fully qualified path on the same machine that VSCode is running on."})]})]})]}),"\n",(0,i.jsx)(n.h2,{id:"authenticating-to-a-sas-server",children:"Authenticating to a SAS Server"}),"\n",(0,i.jsx)(n.p,{children:"The extension will attempt to authenticate to the SAS Server over ssh using the auth methods specified in the SSH Server configuration defined on the SAS Server. The extension currently supports using the SSH auth methods listed below:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"#publickey",children:"Publickey"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"#password",children:"Password"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"#keyboard-interactive",children:"Keyboard Interactive"})}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"publickey",children:"Publickey"}),"\n",(0,i.jsx)(n.h4,{id:"ssh-agent",children:"SSH Agent"}),"\n",(0,i.jsxs)(n.p,{children:["When using publickey SSH authentication, The extension can be configured to use keys defined in the SSH Agent. The socket defined in the environment variable ",(0,i.jsx)(n.code,{children:"SSH_AUTH_SOCK"})," is used to communicate with ssh-agent to authenticate the SSH session. The private key must be registered with the ssh-agent when using this method. The steps for configuring SSH follow. Follow the steps below to complete the setup."]}),"\n",(0,i.jsx)(n.h5,{id:"windows",children:"Windows"}),"\n",(0,i.jsxs)(n.ol,{children:["\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:["Enable OpenSSH for Windows using these ",(0,i.jsx)(n.a,{href:"https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse?tabs=gui",children:"instructions"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.a,{href:"https://phoenixnap.com/kb/windows-set-environment-variable",children:"Create an environment variable"})," named SSH_AUTH_SOCK with value ",(0,i.jsx)(n.code,{children:"//./pipe/openssh-ssh-agent"}),"\n(Windows uses a named pipe for the auth sock)."]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Note"}),": An attempt to create the varible using Powershell command line did not register; suggest using these GUI instructions."]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:["Ensure that the ssh-agent service is running and set the Startup type to Automatic using ",(0,i.jsx)(n.a,{href:"https://dev.to/aka_anoop/how-to-enable-openssh-agent-to-access-your-github-repositories-on-windows-powershell-1ab8",children:"these instructions"})]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.a,{href:"https://medium.com/risan/upgrade-your-ssh-key-to-ed25519-c6e8d60d3c54",children:"Generate ed25519 keys"})," with the following command (email address is not binding; you can use any email address):"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:'ssh-keygen -o -a 100 -t ed25519 -f ~/.ssh/id_ed25519 -C "youremail@company.com"\n'})}),"\n",(0,i.jsxs)(n.ol,{start:"5",children:["\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"You are prompted to enter additional information. If you did not enter a path, a default path is provided for you. You can also specify a passphrase. If you do not specify a passphrase, your key is not password-protected. Press Enter to accept the default value for each prompt."}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Enter a file in which to save the key (/c/Users/you/.ssh/id_ed25519):[Press enter]"}),"\n",(0,i.jsx)(n.li,{children:"Enter passphrase (empty for no passphrase): [Type a passphrase]"}),"\n",(0,i.jsx)(n.li,{children:"Enter same passphrase again: [Type passphrase again]"}),"\n"]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"Define an entry in ~/.ssh/config using the following format:"}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"Host host.machine.name\n    AddKeysToAgent yes\n    IdentityFile /path/to/private/key/with/passphrase\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Note: if ~/.ssh/config does not exist, run the following Powershell command to create it: ",(0,i.jsx)(n.code,{children:"Out-File -FilePath config"})]}),"\n",(0,i.jsxs)(n.ol,{start:"7",children:["\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"Add the private key to ssh-agent: ssh-add /path/to/private/key/with/passphrase"}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:["In VS Code, define a connection profile (see detailed instructions in the ",(0,i.jsx)(n.a,{href:"/vscode-sas-extension/Configurations/Profiles/#add-new-connection-profile",children:"Add New Connection Profile"})," section). The connection for the remote server is stored in the settings.json file."]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'"ssh_test": {\n    "connectionType": "ssh",\n    "host": "host.machine.name",\n    "saspath": "/path/to/sas/executable",\n    "username": "username",\n    "port": 22\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"Note: the default path to the SAS executable (saspath) is /opt/sasinside/SASHome/SASFoundation/9.4/bin/sas_u8. Check with your SAS administrator for the exact path."}),"\n",(0,i.jsxs)(n.ol,{start:"9",children:["\n",(0,i.jsx)(n.li,{children:"Add the public part of the keypair to the SAS server. Add the contents of the key file to the ~/.ssh/authorized_keys file."}),"\n"]}),"\n",(0,i.jsx)(n.h5,{id:"mac",children:"Mac"}),"\n",(0,i.jsxs)(n.ol,{children:["\n",(0,i.jsx)(n.li,{children:"Start ssh-agent in the background:"}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:'eval "$(ssh-agent -s)"\n'})}),"\n",(0,i.jsxs)(n.ol,{start:"2",children:["\n",(0,i.jsx)(n.li,{children:"Ensure that SSH_AUTH_SOCK has a value"}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-sh",children:"echo $SSH_AUTH_SOCK\n"})}),"\n",(0,i.jsxs)(n.ol,{start:"3",children:["\n",(0,i.jsx)(n.li,{children:"Define an entry in $HOME/.ssh/config of the form:"}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"Host host.machine.name\n  AddKeysToAgent yes\n  UseKeychain yes\n  IdentityFile /path/to/private/key/with/passphrase\n"})}),"\n",(0,i.jsxs)(n.ol,{start:"4",children:["\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"Add the private key to ssh-agent: ssh-add /path/to/private/key/with/passphrase"}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsxs)(n.p,{children:["Define a connection profile in settings.json for a remote server (see detailed instructions in the ",(0,i.jsx)(n.a,{href:"/vscode-sas-extension/Configurations/Profiles/#add-new-connection-profile",children:"Add New Connection Profile"})," section):"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'"ssh_test": {\n    "connectionType": "ssh",\n    "host": "host.machine.name",\n    "saspath": "/path/to/sas/executable",\n    "username": "username",\n    "port": 22\n}\n'})}),"\n",(0,i.jsxs)(n.ol,{start:"6",children:["\n",(0,i.jsx)(n.li,{children:"Add the public part of the keypair to the SAS server. Add the contents of the key file to the ~/.ssh/authorized_keys file."}),"\n"]}),"\n",(0,i.jsx)(n.h4,{id:"private-key-file-path",children:"Private Key File Path"}),"\n",(0,i.jsxs)(n.p,{children:["A private key can optionally be specified in the ",(0,i.jsx)(n.code,{children:"privateKeyFilePath"})," field in the connection profile for SAS 9.4 (remote - SSH). This is useful for auth setups where the SSH Agent cannot be used. If a private key file contains a passphrase, the user will be prompted to enter it during each Session creation for which it is used."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'"ssh_test": {\n    "connectionType": "ssh",\n    "host": "host.machine.name",\n    "saspath": "/path/to/sas/executable",\n    "username": "username",\n    "port": 22,\n    "privateKeyFilePath": "/path/to/privatekey/file"\n}\n'})}),"\n",(0,i.jsx)(n.h3,{id:"password",children:"Password"}),"\n",(0,i.jsx)(n.p,{children:"Enter the password using the secure input prompt during each Session creation. To authenticate without using a password, configure the extension using one of the Publickey setups."}),"\n",(0,i.jsx)(n.h3,{id:"keyboard-interactive",children:"Keyboard Interactive"}),"\n",(0,i.jsx)(n.p,{children:"Enter the response to each question using the secure input prompts during each Session creation."})]})}function c(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>r,x:()=>a});var t=s(6540);const i={},o=t.createContext(i);function r(e){const n=t.useContext(o);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),t.createElement(o.Provider,{value:n},e.children)}}}]);