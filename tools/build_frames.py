"""Lista final de frames (nome, quantidade) na ordem da folha. Usado pelo gerador da cena e pelos testes."""
import hero_poses as hp

ORDER = []  # (name, [Cell...])


def add(name, cells):
    ORDER.append((name, cells))


add("front_idle", [hp.front_frame(), hp.front_frame(blink=True)])
add("front_thumb", [hp.front_frame(thumb=0), hp.front_frame(thumb=-1), hp.front_frame(thumb=0, blink=True)])
add("stand", [hp.stand_profile(), hp.stand_profile(blink=True)])
add("walk", [hp.walk_frame(i) for i in range(6)])
add("sit", [hp.sit_frame(i) for i in range(3)])
add("type", [hp.seated_frame("type", i) for i in range(4)])
add("seat_idle", [hp.seated_frame("idle", 0), hp.seated_frame("idle", 0, blink=True)])
add("lean", [hp.seated_frame("lean", 0), hp.seated_frame("lean", 1)])
add("think", [hp.seated_frame("think", 0), hp.seated_frame("think", 1)])
add("scratch", [hp.seated_frame("scratch", i) for i in range(4)])
add("phone_reach", [hp.seated_frame("phone_reach", i) for i in range(3)])
add("phone_up", [hp.seated_frame("phone_up", i) for i in range(3)])
add("phone_look", [hp.seated_frame("phone_look", 0), hp.seated_frame("phone_look", 1)])
add("phone_tap", [hp.seated_frame("phone_tap", i) for i in range(2)])
add("success", [hp.seated_frame("success", i) for i in range(4)])
