# SMTP Mail Server - Complete Network Architecture

## Network-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Internet/DNS Layer"
        DNS[DNS Servers<br/>MX, A, TXT Records]
        ExternalSMTP[External SMTP Servers<br/>Gmail, Yahoo, etc.]
    end

    subgraph "Azure Cloud Infrastructure"
        AzureVM[Azure VM<br/>20.193.253.234<br/>Ubuntu 24.04.3]
        NSG[Network Security Group<br/>Firewall Rules]
        
        subgraph "Nginx Reverse Proxy"
            Nginx[Nginx Server<br/>Port 80/443]
            SSL[SSL/TLS Certificates<br/>Let's Encrypt<br/>mail.kunalpatil.me]
        end
        
        subgraph "PM2 Process Manager"
            PM2[PM2 Daemon<br/>Process Manager]
        end
        
        subgraph "Node.js Application Layer"
            AppEntry[index.js<br/>Entry Point]
            
            subgraph "API Server"
                APIServer[Express API Server<br/>Port 3000<br/>0.0.0.0:3000]
                APIRoutes[API Routes<br/>/api/auth<br/>/api/mails<br/>/api/domains]
                Middleware[Middleware<br/>CORS, Helmet<br/>Body Parser<br/>Multer Upload]
            end
            
            subgraph "SMTP Server"
                SMTPServer[SMTP Server<br/>Port 2525<br/>0.0.0.0:2525]
                SMTPHandlers[SMTP Handlers<br/>onAuth<br/>onMailFrom<br/>onRcptTo<br/>onData]
                MailParser[Mail Parser<br/>simpleParser]
            end
        end
        
        subgraph "Service Layer"
            MailService[Mail Service<br/>createMail<br/>sendMail<br/>receiveMail]
            AuthService[Auth Service<br/>authenticateSMTP<br/>authenticateAPI<br/>JWT]
            DomainService[Domain Service<br/>createDomain<br/>verifyDomain<br/>MX Check]
            UserService[User Service<br/>createUser<br/>findUser<br/>verifyPassword]
            AzureStorage[Azure Storage Service<br/>Upload/Download<br/>Attachments]
        end
        
        subgraph "Data Layer"
            MongoDB[(MongoDB<br/>mongodb://localhost:27017<br/>Database: test/mailserver)]
            
            subgraph "MongoDB Collections"
                UsersCollection[(Users Collection<br/>email, password, name)]
                DomainsCollection[(Domains Collection<br/>name, mx_record, verified)]
                MailboxesCollection[(Mailboxes Collection<br/>email, user_id)]
                MailsCollection[(Mails Collection<br/>from, to, subject<br/>body, attachments<br/>status, message_id)]
            end
        end
        
        subgraph "External Services Integration"
            SendGrid[SendGrid SMTP Relay<br/>smtp.sendgrid.net:587<br/>API Key Auth]
            AzureBlob[Azure Blob Storage<br/>Attachment Storage]
        end
        
        subgraph "Network Ports & Routing"
            IPTables[iptables NAT<br/>Port 25 → 2525<br/>REDIRECT]
            Firewall[Firewall Rules<br/>Port 25, 2525, 3000<br/>80, 443 OPEN]
        end
    end

    subgraph "Client Applications"
        WebClient[Web Client<br/>React App<br/>mailing.kunalpatil.me]
        EmailClients[Email Clients<br/>Outlook, Thunderbird<br/>Mobile Apps]
        APIUsers[API Consumers<br/>Postman, cURL<br/>Scripts]
    end

    subgraph "DNS Configuration"
        MXRecord[MX Record<br/>kunalpatil.me<br/>10 mailing.kunalpatil.me]
        ARecord[A Record<br/>mailing.kunalpatil.me<br/>→ 20.193.253.234]
        SPFRecord[SPF Record<br/>TXT: v=spf1 mx ...]
        DKIMRecord[DKIM Record<br/>Public Key in DNS]
    end

    %% DNS Flow
    DNS --> MXRecord
    DNS --> ARecord
    DNS --> SPFRecord
    DNS --> DKIMRecord
    MXRecord --> AzureVM
    ARecord --> AzureVM

    %% Incoming Mail Flow
    ExternalSMTP -->|SMTP Port 25| IPTables
    IPTables -->|Redirect to 2525| SMTPServer
    SMTPServer --> SMTPHandlers
    SMTPHandlers -->|Authenticate| AuthService
    SMTPHandlers -->|Parse Mail| MailParser
    MailParser -->|Store Mail| MailService
    MailService -->|Save to DB| MailsCollection
    MailService -->|Link to| MailboxesCollection
    
    %% Outgoing Mail Flow
    WebClient -->|HTTPS 443| Nginx
    APIUsers -->|HTTPS 443| Nginx
    Nginx -->|Proxy Pass| APIServer
    APIServer -->|Auth| AuthService
    APIServer -->|Create Mail| MailService
    MailService -->|Store Draft| MailsCollection
    APIServer -->|Upload Files| AzureStorage
    AzureStorage -->|Store Blobs| AzureBlob
    
    %% Send Mail Flow
    APIServer -->|Send Request| MailService
    MailService -->|Create Transporter| SendGrid
    MailService -->|Relay Mail| SendGrid
    SendGrid -->|Deliver| ExternalSMTP
    
    %% Authentication Flow
    EmailClients -->|SMTP Port 2525| SMTPServer
    SMTPServer -->|onAuth| AuthService
    AuthService -->|Verify User| UserService
    UserService -->|Query DB| UsersCollection
    
    %% Domain Verification Flow
    APIServer -->|Verify Domain| DomainService
    DomainService -->|Check MX| DNS
    DomainService -->|Save Result| DomainsCollection
    
    %% Data Access Flow
    MailService -->|Read/Write| MongoDB
    UserService -->|Read/Write| UsersCollection
    DomainService -->|Read/Write| DomainsCollection
    AuthService -->|Verify Password| UserService
    
    %% Process Management
    PM2 -->|Manages| AppEntry
    AppEntry -->|Starts| APIServer
    AppEntry -->|Starts| SMTPServer
    AppEntry -->|Connects| MongoDB
    
    %% Network Security
    NSG -->|Controls| Firewall
    Firewall -->|Allows| APIServer
    Firewall -->|Allows| SMTPServer
    Firewall -->|Allows| Nginx
    
    %% SSL/TLS
    SSL -->|Provides HTTPS| Nginx
    SSL -->|Certbot Managed| Nginx

    style AzureVM fill:#0078d4,stroke:#005a9e,color:#fff
    style SMTPServer fill:#28a745,stroke:#1e7e34,color:#fff
    style APIServer fill:#17a2b8,stroke:#138496,color:#fff
    style MongoDB fill:#13aa52,stroke:#0d8043,color:#fff
    style SendGrid fill:#1a82e2,stroke:#0f5fa0,color:#fff
    style AzureBlob fill:#0078d4,stroke:#005a9e,color:#fff
    style Nginx fill:#009639,stroke:#006829,color:#fff
    style PM2 fill:#2b037a,stroke:#1d0252,color:#fff
```

## Data Flow Diagrams

### 1. Incoming Mail Flow (External to Server)

```mermaid
sequenceDiagram
    participant External as External Mail Server
    participant DNS as DNS Server
    participant NAT as iptables NAT
    participant SMTP as SMTP Server (2525)
    participant Auth as Auth Service
    participant Mail as Mail Service
    participant DB as MongoDB
    
    External->>DNS: Query MX record for kunalpatil.me
    DNS-->>External: Returns: 10 mailing.kunalpatil.me
    External->>DNS: Resolve A record for mailing.kunalpatil.me
    DNS-->>External: Returns: 20.193.253.234
    External->>NAT: SMTP connection on port 25
    NAT->>SMTP: Redirect to port 2525
    SMTP->>SMTP: onRcptTo: Validate recipient mailbox
    SMTP->>DB: Check if mailbox exists
    DB-->>SMTP: Mailbox found/not found
    SMTP->>SMTP: onData: Receive mail stream
    SMTP->>SMTP: Parse mail with mailparser
    SMTP->>Mail: receiveMail(mailData)
    Mail->>DB: Find mailbox by email
    Mail->>DB: Save mail to Mails collection
    Mail-->>SMTP: Mail stored successfully
    SMTP-->>External: 250 OK (Mail queued)
```

### 2. Outgoing Mail Flow (API to SendGrid to External)

```mermaid
sequenceDiagram
    participant Client as Web Client/API
    participant Nginx as Nginx (HTTPS)
    participant API as API Server (3000)
    participant Auth as Auth Service
    participant Mail as Mail Service
    participant Storage as Azure Storage
    participant SendGrid as SendGrid Relay
    participant External as External Mail Server
    
    Client->>Nginx: POST /api/mails (Create draft)
    Nginx->>API: Proxy request
    API->>Auth: Verify JWT token
    Auth-->>API: Token valid
    API->>Mail: createMail(mailData)
    Mail->>DB: Save draft mail
    Mail-->>API: Mail created (ID: xxx)
    
    alt Has Attachments
        API->>Storage: Upload attachments
        Storage->>AzureBlob: Store files
        Storage-->>API: Attachment URLs
        API->>DB: Update mail with attachments
    end
    
    API-->>Client: 201 Mail created
    
    Client->>Nginx: POST /api/mails/:id/send
    Nginx->>API: Proxy request
    API->>Mail: sendMail(mailId, from, to)
    Mail->>Mail: createTransporter(fromEmail)
    Mail->>SendGrid: Connect smtp.sendgrid.net:587
    Mail->>SendGrid: AUTH PLAIN (API Key)
    SendGrid-->>Mail: Authentication OK
    Mail->>SendGrid: MAIL FROM: sender@kunalpatil.me
    Mail->>SendGrid: RCPT TO: recipient@gmail.com
    Mail->>SendGrid: DATA (mail content)
    SendGrid-->>Mail: 250 OK (queued)
    Mail->>DB: Update mail status to 'sent'
    Mail-->>API: Mail sent successfully
    API-->>Client: 200 Success
    
    SendGrid->>External: Deliver mail via SMTP
    External-->>SendGrid: 250 OK (delivered)
```

### 3. SMTP Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Email Client
    participant SMTP as SMTP Server
    participant Auth as Auth Service
    participant User as User Service
    participant DB as MongoDB
    
    Client->>SMTP: Connect to port 2525
    SMTP-->>Client: 220 ESMTP ready
    Client->>SMTP: EHLO client.example.com
    SMTP-->>Client: 250-AUTH PLAIN LOGIN
    Client->>SMTP: AUTH PLAIN <base64>
    SMTP->>SMTP: Extract username/password
    SMTP->>Auth: authenticateSMTP(username, password)
    Auth->>User: findUserByEmail(username)
    User->>DB: Query Users collection
    DB-->>User: User document
    User-->>Auth: User found
    Auth->>User: verifyPassword(user, password)
    User->>DB: Compare password hash
    DB-->>User: Password valid
    User-->>Auth: Authentication successful
    Auth-->>SMTP: User authenticated
    SMTP-->>Client: 235 Authentication successful
```

### 4. Domain Verification Flow

```mermaid
sequenceDiagram
    participant Admin as Admin/API Client
    participant API as API Server
    participant Domain as Domain Service
    participant DNS as DNS Tools
    participant ExternalDNS as External DNS Server
    participant DB as MongoDB
    
    Admin->>API: POST /api/domains {name: "kunalpatil.me"}
    API->>Domain: createDomain(domainData)
    Domain->>DNS: checkMXRecord("kunalpatil.me")
    DNS->>ExternalDNS: Query MX record
    ExternalDNS-->>DNS: Returns MX: 10 mailing.kunalpatil.me
    DNS->>ExternalDNS: Verify A record for mailing.kunalpatil.me
    ExternalDNS-->>DNS: Returns: 20.193.253.234
    DNS-->>Domain: MX record verified
    Domain->>DB: Save domain with verified=true
    DB-->>Domain: Domain saved
    Domain-->>API: Domain created
    API-->>Admin: 201 Domain created & verified
```

## Component Interaction Architecture

```mermaid
graph LR
    subgraph "Client Layer"
        WC[Web Client<br/>React]
        EC[Email Clients]
    end
    
    subgraph "Load Balancer/Proxy Layer"
        NG[Nginx<br/>Reverse Proxy<br/>SSL Termination]
    end
    
    subgraph "Application Server Layer"
        API[API Server<br/>Express.js<br/>REST API]
        SMTP[SMTP Server<br/>smtp-server<br/>ESMTP Protocol]
    end
    
    subgraph "Business Logic Layer"
        MS[Mail Service]
        AS[Auth Service]
        DS[Domain Service]
        US[User Service]
        AZS[Azure Storage Service]
    end
    
    subgraph "Data Persistence Layer"
        MONGO[(MongoDB<br/>NoSQL Database)]
        AZBLOB[(Azure Blob Storage<br/>File Storage)]
    end
    
    subgraph "External Services"
        SG[SendGrid<br/>SMTP Relay]
        DNS_EXT[External DNS<br/>MX/A Records]
    end
    
    WC -->|HTTPS:443| NG
    EC -->|SMTP:2525| SMTP
    NG -->|HTTP:3000| API
    
    API --> MS
    API --> AS
    API --> DS
    API --> US
    API --> AZS
    
    SMTP --> MS
    SMTP --> AS
    
    MS --> MONGO
    MS --> SG
    AS --> US
    DS --> DNS_EXT
    US --> MONGO
    AZS --> AZBLOB
```

## Network Topology

```mermaid
graph TB
    subgraph "Internet"
        Users[Internet Users]
        MailServers[External Mail Servers<br/>Gmail, Yahoo, etc.]
    end
    
    subgraph "Azure Public Cloud"
        PublicIP[Public IP<br/>20.193.253.234]
        
        subgraph "Azure Virtual Network"
            Subnet[Subnet<br/>10.0.0.0/24]
            
            subgraph "Azure VM - mailing-server"
                Eth0[Network Interface<br/>eth0: 10.0.0.4]
                
                subgraph "OS Level - Ubuntu 24.04"
                    iptables[iptables NAT<br/>25 to 2525]
                    PM2_DAEMON[PM2 Daemon<br/>Process Manager]
                    
                    subgraph "Application Ports"
                        Port2525[Port 2525<br/>SMTP Server]
                        Port3000[Port 3000<br/>API Server]
                        Port80[Port 80<br/>Nginx HTTP]
                        Port443[Port 443<br/>Nginx HTTPS]
                    end
                end
            end
        end
        
        NSG[Network Security Group<br/>Firewall Rules<br/>Inbound: 25, 80, 443, 2525, 3000]
    end
    
    subgraph "Internal Services"
        MongoDB_Local[(MongoDB<br/>127.0.0.1:27017)]
    end
    
    subgraph "External Cloud Services"
        SendGrid_Cloud[SendGrid Cloud<br/>smtp.sendgrid.net]
        AzureStorage_Cloud[Azure Storage<br/>Blob Storage]
    end
    
    Users -->|HTTPS:443| PublicIP
    MailServers -->|SMTP:25| PublicIP
    
    PublicIP --> NSG
    NSG --> Subnet
    Subnet --> Eth0
    
    Eth0 --> iptables
    iptables --> Port2525
    
    Users -->|HTTPS:443| Port443
    Port443 --> Port3000
    
    MailServers -->|SMTP:25| iptables
    
    PM2_DAEMON --> Port2525
    PM2_DAEMON --> Port3000
    
    Port2525 --> MongoDB_Local
    Port3000 --> MongoDB_Local
    
    Port3000 --> SendGrid_Cloud
    Port3000 --> AzureStorage_Cloud
    
    style PublicIP fill:#0078d4,stroke:#005a9e,color:#fff
    style NSG fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style Port2525 fill:#28a745,stroke:#1e7e34,color:#fff
    style Port3000 fill:#17a2b8,stroke:#138496,color:#fff
    style MongoDB_Local fill:#13aa52,stroke:#0d8043,color:#fff
```

## DNS & Email Routing Architecture

```mermaid
graph TB
    subgraph "DNS Zone - kunalpatil.me"
        RootDNS[Root DNS Servers]
        TLD[.me TLD Servers]
        NameServers[Name Servers<br/>kunalpatil.me]
        
        subgraph "DNS Records"
            MX[MX Record<br/>10 mailing.kunalpatil.me]
            A_RECORD[A Record<br/>mailing.kunalpatil.me<br/>to 20.193.253.234]
            SPF[SPF Record TXT<br/>v=spf1 mx a:mailing.kunalpatil.me<br/>ip4:20.193.253.234 ~all]
            DKIM[DKIM Record TXT<br/>Public Key]
            DMARC[DMARC Record<br/>_dmarc TXT]
        end
    end
    
    subgraph "Email Routing Process"
        Sender[Email Sender<br/>sender@gmail.com]
        
        subgraph "SMTP Lookup Chain"
            Step1[1. Query MX Record<br/>for kunalpatil.me]
            Step2[2. Resolve A Record<br/>for mailing.kunalpatil.me]
            Step3[3. Connect to<br/>20.193.253.234:25]
        end
        
        MailServer[Your SMTP Server<br/>mailing.kunalpatil.me<br/>20.193.253.234:2525]
    end
    
    Sender --> Step1
    Step1 --> NameServers
    NameServers --> MX
    MX --> Step2
    Step2 --> A_RECORD
    A_RECORD --> Step3
    Step3 --> MailServer
    
    RootDNS --> TLD
    TLD --> NameServers
    
    style MX fill:#ffd700,stroke:#ffb300,color:#000
    style A_RECORD fill:#4caf50,stroke:#388e3c,color:#fff
    style SPF fill:#2196f3,stroke:#1976d2,color:#fff
    style DKIM fill:#9c27b0,stroke:#7b1fa2,color:#fff
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ MAILBOXES : "has"
    DOMAINS ||--o{ USERS : "belongs_to"
    MAILBOXES ||--o{ MAILS : "contains"
    MAILS ||--o{ ATTACHMENTS : "has"
    
    USERS {
        ObjectId _id
        string email
        string password_hash
        string name
        ObjectId domain_id
        datetime created_at
    }
    
    DOMAINS {
        ObjectId _id
        string name
        string mx_record
        boolean verified
        datetime created_at
    }
    
    MAILBOXES {
        ObjectId _id
        string email
        ObjectId user_id
        datetime created_at
    }
    
    MAILS {
        ObjectId _id
        string from_email
        string to_email
        string subject
        string body_text
        string body_html
        string message_id
        string status
        ObjectId mailbox_id
        array attachments
        datetime created_at
    }
    
    ATTACHMENTS {
        string filename
        string contentType
        number size
        string blobName
        string url
    }
```

This comprehensive architecture diagram shows:
- **Network layer**: DNS, routing, firewall
- **Application layer**: API server, SMTP server
- **Service layer**: Business logic services
- **Data layer**: MongoDB and Azure Blob Storage
- **External integrations**: SendGrid, DNS servers
- **Client interactions**: Web clients, email clients
- **Process management**: PM2 daemon
- **Security**: SSL/TLS, authentication flows

