import math

skill_multiplier = [
    {"Skill multiplier": 409},
    {"Skill tree 1": 75},
    {"Skill tree 2": 70},
    {"Skill tree 3": 0},
    {"Skill buff 1": 0},
    {"Skill buff 2": 0},
    {"Skill buff 3": 0},
]

result = 1

for d in skill_multiplier:
    for key, value in d.items():
        if key == "Skill multiplier":
            result *= value / 100      # 409 -> 4.09
        elif value != 0:
            result *= 1 + value / 100  # 75 -> 1.75, 70 -> 1.70

print(result)