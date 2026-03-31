import math
def makepercent(number):
    return number/100
# Here is comment for my AI vibe coding. I will explain how this works by comment. 
# This program will be about let the user calculate the final damage based on stats that they input. 
# This is the first part. We let the user input these stats 
attack = 74137 # In game, stats will show 80-100% range of our atk. Please enter the max atk. 
critical_damage = 11981 # Critical damage 
skill_damage = 20 # Skill Damage Bonus %
bonus_pch_percent= 9 # Clean Hit / Pierce will do X % more damage

# Input type of hits. Let user choose 
critical_hit = True
pierce = True  
weakness = True 
elemental_weakness_percent = 50 # Winning elemetal % Bonus 
if(weakness==True):
    elemental_weakness_percent = 1+makepercent(elemental_weakness_percent)
else:
    elemental_weakness_percent = 1

# Def Parts 
high_def_mon = False
defense = 0 #let defense input if the high def mon is False 
ignore_def1 = 0
ignore_def2 = 0
if(high_def_mon == True):
    defense = 2*attack
if(pierce == True):
    ignore_def1=20
else:
    ignore_def1=0
final_defense = defense*(1-makepercent(ignore_def1))*(1-makepercent(ignore_def2))
def_ratio = attack/(attack+final_defense)


# Final damage reduct customize 
final_reduct_percent = 0 

# First multiplier, I called it General Buff. By default it would be these 3 but I want a button that let user add something else that they can named it and add value on it and apply on this. 
general_multiplier = [{"Boss Damage Bonus":24.52},
                      {"Race Damage Bonus":9.79},
                      {"Target Element Bonus":3.14}]

# Second multiplier, I called it Skill Multiplier. By default it should have 4 Skill multiplier and Skill tree 1,2,3 but they can add more depends on the class they play so add button on the part too. 
skill_multiplier = [{"Skill multiplier":409},
                      {"Skill tree 1":75},
                      {"Skill tree 2":70},
                      {"Skill tree 3":0},
                      {"Skill buff 1":0},
                      {"Skill buff 2":0},
                      {"Skill buff 3":0},]
# Third multiplier, I called them debuff and buff multiplier. This bracket is about damage increase buff and also some skills is to put debuff that let the target take more damage for example. And this should be default on this list. But open to add if somebody got more. 
buff_debuff_multiplier = [{"Skill damage buff 1":60},
                      {"Skill damage buff 2":50},
                      {"Weakness buff ":1.8},
                      {"Kupole damage buff 1":0},
                      {"Kupole damage debuff 2":0},
                      {"Fellow damage buff 1":0},
                      {"Fellow damage debuff 2":0},]

# Fourth multiplier, I called this conditional multiplier. It's the conditional damage increase and from Equipements. 

condition_damage_multiplier = [{"Skia card":1.46},
                      {"Emblem buff":36},
                      {"Sub weapon":0},]

# So, let's seperate each input multiplier catergories into each section so it's easy UI 


# This is the calculation part that does not need to be show 
final_conditional_damage = 1 + sum(list(d.values())[0] for d in condition_damage_multiplier)/100
final_buff_debuff_multiplier = 1 + sum(list(d.values())[0] for d in buff_debuff_multiplier)/100
final_skill_multiplier = 1
for d in skill_multiplier:
    for key, value in d.items():
        if key == "Skill multiplier":
            final_skill_multiplier *= value / 100     
        elif value != 0:
            final_skill_multiplier *= 1 + value / 100  
final_general_multiplier = 1 + sum(list(d.values())[0] for d in general_multiplier)/100
Multipliers = final_buff_debuff_multiplier*final_conditional_damage*final_general_multiplier*final_skill_multiplier

extra_damage_ch = 0.05*attack
skill_damage = 1+makepercent(skill_damage)

# This is the display for the user after calculation 
# So, it's will be something like 
# Damage from ATK Parts = result and they have a button to show how we calculate for example 74,137 (Attack) * 1.2 (skill damage) ... 
# Damage from Critical Parts = result 
# Total Damage = Damage 1 + Damage 2 
damage_part_1 = (attack*(1+makepercent(bonus_pch_percent))+extra_damage_ch)*def_ratio*skill_damage*Multipliers*(1-makepercent(final_reduct_percent))*elemental_weakness_percent
damage_part_2 = critical_damage*skill_damage*Multipliers*(1-makepercent(final_reduct_percent))*elemental_weakness_percent

print("Damage from Attack : ", damage_part_1 )
print("Damage from Critical : ",damage_part_2)

total_damage = damage_part_1+damage_part_2

print("Total Damage : ",total_damage)