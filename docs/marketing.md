# Marketing delivery

Marketing previously displayed a dispatch alert without sending anything. App inbox campaigns now require an authenticated active owner, preview the eligible audience, and persist one private notification per matching customer. The preview does not send messages. Confirming send commits all recipients and a receipt atomically, with a limit of 450 recipients per campaign. An empty or larger audience returns an error without sending.

Inactive clients have a completed appointment at least 56 days ago and no more recent completed visit. Service segments use completed appointment service names. VIP Gold uses the customer's recorded Gold loyalty tier. Disabled/pending accounts and other salons are excluded; new clients without visit history qualify only for All Customers or their recorded loyalty tier.

Only confirmed database commits show delivery success. The browser keeps a campaign ID across network failures, so retrying an unchanged campaign returns its receipt without adding duplicates. Editing the message, title, segment, or channel starts a new campaign.

App inbox delivery persists until the recipient clears it; the customer subscription receives new messages while the app is open and loads saved messages on return. Read/clear actions are private to each recipient. This does not establish that a person read the campaign. Device push, SMS, email and Instagram delivery are not configured; those channel drafts can be copied to an external service. Campaign photos stay in the creative draft and are not attached to inbox messages.

Run `npm run test:marketing` for audience and client checks. `npm run test:rules` runs an emulator-only HTTP-to-customer-listener delivery test and verifies preview, authorization, targeting, privacy, retry deduplication and read/clear behavior. Never run test campaigns against real customers. Deployment requires both the application revision and the included Firestore rules for `users/{uid}/notifications/{id}`. Publishing only frontend code or omitting the rules will not enable delivery. No production campaign is sent by these tests.
