# Glossary & Prescription Types

A complete reference for every term and prescription method you will encounter in Cannoli Trainer.

---

## Glossary

### Training Structure

| Term | Definition |
|------|-----------|
| **Program** | A multi-week training plan you build and assign to athletes. Contains weeks, days, exercises, and sets. |
| **Workout / Session** | A single training day within a program. One day's worth of exercises and sets. |
| **Exercise** | A specific movement (e.g., Back Squat, Bench Press). Exercises live in a shared library you can search when building programs. |
| **Set** | One bout of an exercise performed for a given number of reps. A workout might prescribe 4 sets of 5 reps. |
| **Rep** | One complete repetition of an exercise (lowering and lifting the bar once). |
| **Superset** | Two or more exercises performed back-to-back with minimal rest between them. For example, alternating bench press and barbell rows. |

### Prescription & Load

| Term | Definition |
|------|-----------|
| **Prescription** | The instructions for how heavy and how many reps an athlete should perform on a given exercise. Cannoli Trainer supports six prescription types (see the full breakdown below). |
| **1RM (One-Rep Max)** | The heaviest weight an athlete can lift for exactly one repetition with good form. The foundation for percentage-based programming. |
| **e1RM (Estimated One-Rep Max)** | A calculated estimate of an athlete's 1RM derived from a multi-rep set. For example, lifting 100 kg for 5 reps estimates a 1RM of roughly 117 kg using the Epley formula. |
| **Working Max** | A conservative training number, usually 90-95% of the athlete's true or estimated 1RM. Used as the basis for percentage prescriptions so the athlete is not grinding at true max percentages every session. |
| **Generated Max** | A 1RM estimate that Cannoli Trainer calculates automatically from logged training data, as opposed to a manually entered max. |
| **MaxSnapshot** | A saved record of an athlete's estimated 1RM for a specific exercise at a specific point in time. Used to track strength progress and to calculate percentages for programming. |
| **Fixed Load** | A prescription where you specify the exact weight (e.g., "185 lbs"). The athlete lifts that number, no calculation needed. |
| **Progressive Overload** | The principle of gradually increasing training stress over time — more weight, more reps, or more sets — to drive continued adaptation. |

### Effort & Intensity Scales

| Term | Definition |
|------|-----------|
| **RPE (Rate of Perceived Exertion)** | A 1-10 scale measuring how hard a set felt. In strength training, we use the 6-10 range based on the Tuchscherer/RTS system (see RPE scale below). |
| **RIR (Reps in Reserve)** | How many more reps the athlete could have done before failure. RIR = 10 minus RPE. For example, RPE 8 means 2 reps in reserve (2 RIR). |

#### RPE Scale (6-10)

| RPE | RIR | What It Feels Like |
|-----|-----|-------------------|
| **10** | 0 | Maximum effort — no reps left. Could not have done one more. |
| **9.5** | 0.5 | Could maybe do 1 more rep, but not confident. |
| **9** | 1 | 1 rep left in reserve. One more good rep was there. |
| **8.5** | 1.5 | Could definitely do 1 more, maybe 2. |
| **8** | 2 | 2 reps left in reserve. Challenging but controlled. |
| **7.5** | 2.5 | Could definitely do 2 more, maybe 3. |
| **7** | 3 | 3 reps left in reserve. Moderate effort, good speed. |
| **6.5** | 3.5 | Could definitely do 3 more, maybe 4. |
| **6** | 4 | 4 reps left in reserve. Warm-up or light working weight. |

RPE supports half-point increments (e.g., RPE 8.5). When both RPE and RIR are displayed, they appear together: "RPE 8 / 2 RIR."

### Tempo

| Term | Definition |
|------|-----------|
| **Tempo Notation** | A 4-digit format describing the speed of each phase of a rep. Written as **E-P1-C-P2** (e.g., **3-1-2-0**). |

**How to read tempo (using 3-1-2-0 as an example):**

| Position | Phase | Example | Meaning |
|----------|-------|---------|---------|
| 1st number | **Eccentric** (lowering) | 3 | Lower the weight for 3 seconds |
| 2nd number | **Pause at bottom** | 1 | Hold at the bottom for 1 second |
| 3rd number | **Concentric** (lifting) | 2 | Lift the weight over 2 seconds |
| 4th number | **Pause at top** | 0 | No pause at the top |

A tempo of **3-1-2-0** on a squat means: 3-second descent, 1-second pause in the hole, 2-second drive up, no pause at the top. An "X" in the concentric position means "as fast as possible" (e.g., 3-1-X-0).

### Velocity-Based Training (VBT)

| Term | Definition |
|------|-----------|
| **VBT (Velocity-Based Training)** | A training method that uses bar speed (measured in meters per second) to guide load selection and monitor fatigue. |
| **Velocity Target** | A prescribed bar speed for a set (e.g., 0.8 m/s). The athlete adjusts load to hit the target speed. |
| **Load-Velocity Profile** | A chart mapping how an athlete's bar speed changes as weight increases. Each athlete has a unique profile for each exercise. |
| **Velocity Loss** | How much bar speed drops from the first set to the last set in a session. Used to monitor fatigue. For example, set 1 at 0.82 m/s dropping to set 5 at 0.65 m/s is a 20.7% velocity loss. |
| **Preparedness Indicator** | A comparison of today's bar speed to the athlete's rolling 4-week average at the same load. If today is slower, the athlete may be fatigued or under-recovered. |

### Periodization

| Term | Definition |
|------|-----------|
| **Periodization** | Organizing training into phases with planned variation in volume, intensity, and exercise selection. |
| **Linear Periodization** | A straightforward approach: start lighter with more reps, and progressively add weight while reducing reps over several weeks. Example: Week 1 at 4x8 @ 70%, building to Week 6 at 3x2 @ 90%. |
| **Undulating Periodization (DUP)** | Varying intensity and volume within each week rather than across weeks. For example: Monday heavy (3x3 @ 85%), Wednesday moderate (4x6 @ 75%), Friday light (3x10 @ 65%). |
| **Block Periodization** | Dividing training into focused blocks (usually 3-6 weeks each) that emphasize one quality at a time — typically hypertrophy, strength, then peaking. Each block builds on the last. |

### Analytics & Tracking

| Term | Definition |
|------|-----------|
| **Tonnage (Volume Load)** | Total weight moved in a session or week. Calculated as sets x reps x weight. Example: 4 sets of 5 reps at 100 kg = 2,000 kg tonnage. |
| **Compliance** | The percentage of assigned workouts an athlete actually completes. If you assign 20 sessions and they log 18, compliance is 90%. |
| **PR (Personal Record)** | The best performance an athlete has achieved for a given lift, whether a 1RM, a rep max (e.g., best 5-rep set), or a competition total. |

### Competition

| Term | Definition |
|------|-----------|
| **Weight Class** | The bodyweight category an athlete competes in at a powerlifting meet (e.g., 83 kg, 93 kg). |
| **Federation** | The governing body that sanctions the competition (e.g., USAPL, IPF, USPA, RPS). Each federation has its own rules and weight classes. |
| **DOTS Score** | A bodyweight-adjusted formula for comparing lifters across weight classes. Uses total lifted and bodyweight. Higher is better. The modern replacement for Wilks in many federations. |
| **Wilks Score** | An older bodyweight-adjusted formula for comparing powerlifting totals across weight classes. Still widely used but gradually being replaced by DOTS. |
| **Attempt** | In a powerlifting meet, each lifter gets 3 attempts per lift (squat, bench, deadlift). The best successful attempt for each lift counts toward the total. |
| **Total** | The sum of the best successful attempt for squat, bench press, and deadlift at a meet. This is the primary competitive result. |
| **Flight** | A group of lifters who lift together in the same rotation at a meet. Flight assignments determine warm-up timing. |

---

## Prescription Types Explained

Cannoli Trainer supports six ways to prescribe load for any exercise. You can mix and match prescription types within the same workout — for example, RPE-based squats, percentage-based bench, and velocity-target deadlifts all in one session.

### 1. Percentage of 1RM

**What it means:** The athlete lifts a specific percentage of their one-rep max (or working max).

**When to use it:** Traditional strength programming, peaking blocks, any time you want precise load control based on the athlete's known strength level.

**What the coach enters:** The percentage (e.g., 80%), the number of sets, and the number of reps. You can base it on a true 1RM or a working max.

**What the athlete sees:** The calculated weight based on their max. For example, if their squat 1RM is 200 kg and you prescribe 80%, they see "160 kg" along with "80% 1RM."

**Example:**
| Exercise | Sets | Reps | Prescription |
|----------|------|------|-------------|
| Back Squat | 4 | 5 | 80% of 1RM |

If the athlete's 1RM is 200 kg, they load 160 kg for each set.

---

### 2. RPE (Rate of Perceived Exertion)

**What it means:** The athlete works to a target effort level rather than a fixed weight. The RPE scale (6-10) tells them how hard the set should feel.

**When to use it:** Autoregulated training where daily readiness matters more than hitting an exact number. Good for intermediate to advanced athletes who can accurately gauge effort.

**What the coach enters:** The target RPE (single value like 8, or a range like 7-8), sets, and reps. Optionally a suggested starting weight.

**What the athlete sees:** The target RPE with a description. For example, "RPE 8 — 2 reps left in reserve." If a MaxSnapshot exists, the app can suggest a starting weight using the RPE-to-%1RM lookup table.

**Example:**
| Exercise | Sets | Reps | Prescription |
|----------|------|------|-------------|
| Bench Press | 4 | 3 | RPE 8 |

The athlete works up to a weight where 3 reps feels like an RPE 8 (they could have done 2 more reps). That weight might be different every day depending on recovery and readiness.

---

### 3. RIR (Reps in Reserve)

**What it means:** Identical concept to RPE, but expressed as how many reps the athlete has left. RIR = 10 minus RPE.

**When to use it:** When your athletes think in terms of "reps left in the tank" rather than an RPE number. Functionally equivalent to RPE — just a different way of communicating the same thing.

**What the coach enters:** The target RIR (e.g., 2 RIR), sets, and reps.

**What the athlete sees:** The RIR target with the equivalent RPE shown alongside. For example, "2 RIR (RPE 8)."

**Example:**
| Exercise | Sets | Reps | Prescription |
|----------|------|------|-------------|
| Romanian Deadlift | 3 | 8 | 2 RIR |

The athlete picks a weight for 8 reps where they feel they could do 2 more reps (equivalent to RPE 8).

---

### 4. Velocity Target

**What it means:** The athlete aims to move the bar at a specific speed, measured in meters per second (m/s). Requires a VBT device (e.g., GymAware, PUSH band, or a phone-based app).

**When to use it:** VBT-based programming, daily load autoregulation based on bar speed, or monitoring fatigue within a session. Especially useful for power-focused training.

**What the coach enters:** The target velocity in m/s (e.g., 0.8 m/s), sets, and reps. Optionally a velocity loss threshold (e.g., stop the exercise if velocity drops more than 20% from set 1).

**What the athlete sees:** The target velocity for the set. They adjust load until they hit the prescribed speed. The app shows a comparison of target vs. actual velocity after each set.

**Example:**
| Exercise | Sets | Reps | Prescription |
|----------|------|------|-------------|
| Deadlift | 5 | 3 | 0.75 m/s target |

The athlete loads the bar to a weight where they can pull at roughly 0.75 m/s for 3 reps. If speed drops below 0.75, they lighten the load; if it is too easy, they add weight.

---

### 5. Autoregulated

**What it means:** A structured "work up to" approach. The athlete builds to a top set at a target RPE, then performs back-off sets at a percentage below that top weight.

**When to use it:** When you want the benefits of RPE-based training with a built-in structure for back-off volume. Common in powerlifting programs and daily max methods.

**What the coach enters:** The target RPE for the top set, the back-off percentage (e.g., -10%), sets, and reps.

**What the athlete sees:** Instructions like "Work up to RPE 8, then 3x5 at -10%." They build to a top set that hits RPE 8, note the weight, then drop 10% for back-off sets.

**Example:**
| Exercise | Top Set | Back-off | Prescription |
|----------|---------|----------|-------------|
| Back Squat | 1x5 @ RPE 8 | 3x5 @ -10% | Autoregulated |

If the athlete works up to 180 kg for 5 at RPE 8, the back-off sets are 3x5 at 162 kg (180 minus 10%).

---

### 6. Fixed Load

**What it means:** A specific weight, no calculation required. The athlete lifts exactly what you write.

**When to use it:** Accessory work, rehabilitation exercises, beginners who are not yet tested for a 1RM, or any time you just want to tell someone exactly what to put on the bar.

**What the coach enters:** The exact weight (e.g., 185 lbs or 40 kg), sets, and reps.

**What the athlete sees:** The weight, sets, and reps. No percentages, no RPE — just the number.

**Example:**
| Exercise | Sets | Reps | Prescription |
|----------|------|------|-------------|
| DB Lateral Raise | 3 | 15 | 25 lbs |

The athlete grabs the 25 lb dumbbells and does 3 sets of 15.

---

## Quick Comparison: All 6 Prescription Types

| Type | Coach Enters | Athlete Sees | Best For |
|------|-------------|-------------|----------|
| **% of 1RM** | Percentage, sets, reps | Calculated weight + percentage | Peaking, structured programs |
| **RPE** | Target RPE (or range), sets, reps | RPE target with description | Daily autoregulation, advanced athletes |
| **RIR** | Target RIR, sets, reps | RIR target (with RPE equivalent) | Athletes who prefer "reps left" framing |
| **Velocity** | Target m/s, sets, reps | Target speed, actual vs. target | VBT users, power training, fatigue monitoring |
| **Autoregulated** | Target RPE + back-off %, sets, reps | "Work up to RPE X, then -Y%" | Powerlifting, daily max methods |
| **Fixed Load** | Exact weight, sets, reps | The weight | Accessories, rehab, beginners |
