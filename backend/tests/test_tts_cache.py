from util import tts_cache_name


def test_cache_name_stable_and_language_scoped():
    a = tts_cache_name("hola", "es")
    assert a == tts_cache_name("hola", "es")
    assert a != tts_cache_name("hola", "en")


def test_cache_name_provider_scoped():
    assert tts_cache_name("hi", "en", "el") != tts_cache_name("hi", "en", "kk")
