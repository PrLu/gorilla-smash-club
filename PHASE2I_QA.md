# Phase 2i QA Checklist & Usability Testing

## 10-Step QA Checklist

### 1. Design System Verification
- [ ] Navigate to `/design` page
- [ ] Verify all color tokens display correctly
- [ ] Test all button variants (5 variants × 3 sizes = 15 combinations)
- [ ] Test input states (normal, error, disabled, with icons)
- [ ] Test modal opens/closes with keyboard (ESC) and mouse
- [ ] Verify skeleton loaders animate

### 2. Responsive Layout Testing
- [ ] Test at 375px width (iPhone SE)
- [ ] Test at 768px width (iPad portrait)
- [ ] Test at 1024px width (iPad landscape/small laptop)
- [ ] Test at 1920px width (desktop)
- [ ] Verify no horizontal scroll at any breakpoint
- [ ] Check mobile menu works on small screens

### 3. Typography & Readability
- [ ] All text readable at arm's length on mobile
- [ ] Heading hierarchy is logical (h1 > h2 > h3)
- [ ] Line length not exceeding 75 characters in reading sections
- [ ] Sufficient line-height for readability (1.5+)
- [ ] Font sizes scale appropriately across breakpoints

### 4. Color Contrast & Accessibility
- [ ] Run Lighthouse accessibility audit (score 95+)
- [ ] Check color contrast ratios meet WCAG AA
- [ ] Test with browser color blindness simulator
- [ ] Verify focus indicators visible on all interactive elements
- [ ] Check screen reader announces form errors

### 5. Keyboard Navigation
- [ ] Tab through entire Dashboard page
- [ ] Navigate tournament detail tabs with keyboard
- [ ] Open and close modals with ESC key
- [ ] Access all form inputs with Tab
- [ ] Verify focus trap works in modals
- [ ] Check focus returns to trigger after modal close

### 6. Loading States
- [ ] All async content shows skeleton loaders
- [ ] Button shows spinner when `isLoading={true}`
- [ ] Transitions smooth between loading and loaded states
- [ ] No layout shift when content loads (CLS < 0.1)
- [ ] Error states display helpful messages

### 7. Interactive Elements
- [ ] All buttons have hover effects
- [ ] Cards have hover shadow (where `hoverable={true}`)
- [ ] Forms validate before submission
- [ ] Toast notifications appear for all user actions
- [ ] Real-time updates work (test with 2 browser windows)

### 8. Motion & Animations
- [ ] Page transitions smooth
- [ ] Stagger animations work on lists
- [ ] Score updates animate in LiveScoreCard
- [ ] Enable "Reduce motion" in OS settings
- [ ] Verify animations disabled with reduced motion

### 9. Tournament Flow
- [ ] Create tournament with new form design
- [ ] Add participant via ManualParticipantForm
- [ ] View fixtures with FixturesViewer
- [ ] Check live scoreboard with LiveScoreCard
- [ ] Manage participants on participants page

### 10. Cross-browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 5 Scripted Usability Tasks

### Task 1: First-Time Organizer Flow
**Participant**: Someone who has never used the app
**Scenario**: Create your first tournament

**Steps:**
1. Land on homepage
2. Click "Get Started Free"
3. Sign up with email/password
4. Navigate to Dashboard
5. Find and click "Create Tournament"
6. Fill out form (provide all data on a card)
7. Submit tournament
8. Explore tournament detail page

**Success Criteria:**
- User completes signup without help
- User finds "Create Tournament" button within 10 seconds
- Form validation provides clear feedback
- User understands next steps after creation

**Observe:**
- Time to completion
- Number of errors/confusion points
- Clarity of UI labels
- Mobile vs desktop experience

---

### Task 2: Mobile Fixtures Viewing
**Participant**: Tournament participant
**Scenario**: Check your match schedule on mobile

**Steps:**
1. Open tournament page on mobile device
2. Find and tap "Fixtures" tab
3. Locate your match in Round 1
4. Tap to view match details
5. Note the court assignment

**Success Criteria:**
- User finds Fixtures tab without confusion
- Match cards are tappable and responsive
- Modal shows clear match information
- Court/time information is readable

**Observe:**
- Ease of tapping small targets
- Readability of text on mobile
- Understanding of fixture layout
- Time to find specific match

---

### Task 3: Live Score Monitoring
**Participant**: Spectator or player
**Scenario**: Watch live match scores update

**Setup:** Have organizer update scores while user watches

**Steps:**
1. Navigate to Live Scoreboard
2. Identify matches "In Progress"
3. Watch for score updates (organizer updates in another window)
4. Note when match completes
5. Check completed matches section

**Success Criteria:**
- User sees real-time updates without refresh
- Live indicator clearly visible
- Score numbers large and readable
- Completed matches move to correct section

**Observe:**
- Understanding of live vs scheduled
- Visibility of update indicators
- Readability from distance (TV display scenario)

---

### Task 4: Participant Invitation (Organizer)
**Participant**: Tournament organizer
**Scenario**: Invite 3 friends who don't have accounts

**Steps:**
1. Go to your tournament
2. Click "Manage Participants"
3. Click "Add Participant"
4. Enter first friend's email
5. Toggle "Send invitation email"
6. Review preview
7. Submit
8. Repeat for 2 more participants
9. Check participant list updates

**Success Criteria:**
- User understands how to add participants
- Email/name fields are clear
- Preview shows what will be sent
- Confirmation toast appears
- Participant appears in list immediately

**Observe:**
- Clarity of form labels
- Understanding of email toggle
- Confidence in what happens after submission
- Ease of adding multiple participants

---

### Task 5: Keyboard-Only Navigation
**Participant**: Power user or accessibility user
**Scenario**: Complete all actions without using mouse

**Steps:**
1. Tab to "Tournaments" link
2. Press Enter to navigate
3. Tab to first tournament card
4. Press Enter to open
5. Tab to "Fixtures" tab
6. Press Enter
7. Tab through match cards
8. Press Enter on a match
9. Tab to close button in modal
10. Press Enter to close

**Success Criteria:**
- All interactive elements reachable via Tab
- Focus indicator always visible
- Enter/Space activates buttons
- Modal can be closed with ESC
- No keyboard traps

**Observe:**
- Logical tab order
- Visibility of focus indicators
- Time to complete vs mouse
- Frustration points

---

## Usability Metrics to Track

### Quantitative
- **Task Completion Rate**: % of users who complete task
- **Time on Task**: Average time to complete each task
- **Error Rate**: Number of errors per task
- **Clicks to Complete**: Number of clicks required

### Qualitative
- **Ease of Use** (1-5 scale): How easy was the task?
- **Clarity** (1-5 scale): Were labels and instructions clear?
- **Satisfaction** (1-5 scale): Overall satisfaction with experience
- **Likelihood to Recommend** (1-10 scale): NPS score

### Target Benchmarks
- Task completion rate: > 90%
- Average ease of use rating: > 4.0
- Critical errors: 0
- NPS score: > 50

## Post-Task Questions

Ask participants after each task:

1. What was most confusing about this task?
2. What would you change to make it easier?
3. Did you notice anything that surprised you?
4. On a scale of 1-5, how confident are you that you completed the task correctly?
5. Would you use this feature again?

## Issues Log Template

| Issue # | Task | Severity | Description | Suggested Fix |
|---------|------|----------|-------------|---------------|
| 1 | Task 1 | High | Button too small on mobile | Increase size to 44px min |
| 2 | Task 3 | Medium | Live indicator not noticeable | Increase size, add pulse |

## Next Steps After Testing

1. **Analyze Results**: Review metrics and qualitative feedback
2. **Prioritize Fixes**: High severity first
3. **Iterate**: Implement fixes
4. **Re-test**: Verify fixes work
5. **Document**: Update PHASE2I.md with learnings

