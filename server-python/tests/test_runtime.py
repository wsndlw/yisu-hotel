def test_mysql_sha2_auth_dependency_is_installed() -> None:
    import cryptography

    assert cryptography.__version__
