# Government Contract Opportunity Survey

Standalone market-research website created by Apropos Group LLC to gather feedback on the challenges businesses face when discovering, evaluating, and pursuing government contract opportunities.

## Purpose

The website presents a purpose-driven, mobile-first survey without disclosing proprietary product methods, matching logic, technical architecture, or internal business workflows.

The research measures:

- respondent type and government markets of interest
- government-contracting experience
- common opportunity-discovery and pursuit challenges
- current contract-search methods
- interest in relevant opportunity discovery
- interest in opportunity-fit evaluation
- potential demand for professional Contract Proposal Development
- optional follow-up interest

## Included Files

- `index.html` — hero, participation assurances, nine-question survey, optional follow-up, About/Community Purpose section
- `styles.css` — responsive desktop and mobile design
- `survey.js` — multi-step navigation, validation, source tracking, consent controls, and secure form submission
- `netlify/functions/submit-survey.js` — server-side validation and protected Supabase insertion
- `thank-you.html` — approved community-purpose thank-you experience and survey-sharing control
- `privacy.html` — survey-specific privacy notice
- `netlify.toml` — publish settings, function configuration, pretty URL routes, and security headers

## Data Architecture

Survey responses are submitted to a same-origin Netlify Function. The function validates all allowed answers, enforces contact-consent rules, and inserts accepted responses into the Supabase table:

```text
public.government_contract_survey_responses
```

The Supabase service-role key is used only by the serverless function and is never included in browser code or committed to this repository. Row Level Security is enabled on the response table with no public read or write policy.

The existing Netlify Forms markup remains as a no-JavaScript fallback. Normal browser submissions use Supabase as the primary response store.

## Netlify Environment Variables

Configure these variables in Netlify:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Recommended scope:

- `SUPABASE_URL`: Functions and Runtime; Builds is also acceptable because the URL is not secret.
- `SUPABASE_SERVICE_ROLE_KEY`: Functions and Runtime only. Do not expose it to browser code, public build output, or repository files.

Configure the values for every deploy context in which submissions should work, including Production and Deploy Previews used for testing.

## Netlify Deployment

1. Create or connect a Netlify project to this GitHub repository.
2. Select the `main` branch.
3. Leave the build command blank.
4. Set the publish directory to `.` if Netlify does not detect it automatically.
5. Confirm the two Supabase environment variables are available to Functions.
6. Deploy or trigger a new deployment after environment-variable changes.
7. Submit one complete test response.
8. Confirm redirection to `/thank-you`.
9. Confirm the test row appears in `public.government_contract_survey_responses` in Supabase.

## Campaign Tracking Links

Use one survey URL with a different source parameter for each outreach channel:

```text
/?source=linkedin
/?source=facebook
/?source=tiktok
/?source=instagram
/?source=email
/?source=partner
/?source=qr
```

Optional UTM values are also stored:

```text
/?source=linkedin&utm_campaign=launch&utm_content=founder-post
```

## Privacy and Competitive Protection

The public survey focuses on user problems, desired outcomes, and professional-service interest. It does not disclose:

- contract-matching methods
- opportunity-ranking or scoring logic
- fit-analysis methodology
- data-combination methods
- internal AI instructions or workflows
- technical architecture
- lead-qualification logic
- pricing strategy
- future product roadmap

## Source of Truth

Research conducted by Apropos Group LLC.

**Businesses grow. People prosper. Communities become stronger.**
