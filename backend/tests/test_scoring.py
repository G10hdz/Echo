from scoring import EchoScorer

scorer = EchoScorer()

def test_en_perfect():
    r = scorer.score("the weather is nice", "the weather is nice")
    assert r["overall_score"] == 100 and r["grade"] == "A+"

def test_en_partial():
    r = scorer.score("the weather is beautiful", "the weather is beautiful today")
    assert 0 < r["overall_score"] < 100
    assert any(w["status"] == "extra" for w in r["words"])

def test_zh_perfect():
    r = scorer.score("你好我是学生", "你好我是学生", language="zh")
    assert r["overall_score"] == 100 and r["grade"] == "A+"

def test_zh_partial():
    r = scorer.score("你好我是学生", "你好我是老师", language="zh")
    assert r["overall_score"] < 100
    assert len(r["flagged"]) >= 1

def test_zh_empty_actual():
    r = scorer.score("你好", "", language="zh")
    assert r["overall_score"] == 0
