%define push_home /opt/push-server
%define push_name push-server
%define push_user bitrix
%define push_group bitrix
%define push_user_id 600
%define push_group_id 600
%define use_systemd (0%{?rhel} && 0%{?rhel} >= 7)

Name:	    bx-push-server	
Version:	2.0.0
Release:	7%{?dist}
Summary:	RPM Package containing Bitrix push-server

License:	Copyright Bitrix 2017
URL:		https://rb.bitrix24.ru/yumrepo/
Source0:	%{name}.tar.gz

Requires:	redis, nodejs >= 8.9.0
BuildArch:  noarch
Conflicts:  push-server

%if %{use_systemd}
Requires: systemd
BuildRequires: systemd
%endif

%description

Install Bitrix push-server

%pre
getent group %{push_group} >/dev/null || \
    groupadd -g %{push_group_id} %{push_group}
getent passwd %{push_user} >/dev/null || \
    useradd -g %{push_group} -u %{push_user_id} \
    -d /home/bitrix -m -c "Bitrix user" %{push_user}
exit 0

%prep
%setup -q -n %{name}


%install
rm -rf %{buildroot}

mkdir -p $RPM_BUILD_ROOT%{push_home}/{config,lib,tests}
mkdir -p $RPM_BUILD_ROOT%{_sysconfdir}/push-server

cp -fr config $RPM_BUILD_ROOT%{push_home}/
cp -fr lib $RPM_BUILD_ROOT%{push_home}/
cp -fr tests $RPM_BUILD_ROOT%{push_home}/
cp -f cluster.js $RPM_BUILD_ROOT%{push_home}/
cp -f package.json $RPM_BUILD_ROOT%{push_home}/
cp -f server.js $RPM_BUILD_ROOT%{push_home}/

cp -rf etc $RPM_BUILD_ROOT/

%if %{use_systemd}
%{__mkdir} -p $RPM_BUILD_ROOT%{_unitdir}
cp -f etc/push-server/push-server.service $RPM_BUILD_ROOT%{_unitdir}/push-server.service
%endif

%post
# test install or upgrade
if [ $1 -eq 1 ]; then
  RPM_ACTION=install
elif [ $1 -gt 1 ]; then
  RPM_ACTION=upgrade
else
  RPM_ACTION=undefined
fi

if [ ! -d /var/log/push-server ]; then
    mkdir /var/log/push-server
    chown -R %{push_user}:%{push_group} /var/log/push-server
fi

if [ $RPM_ACTION == "upgrade" ]; then
    rm -rf %{push_home}/node_modules
fi
pushd %{push_home}/ 2>/dev/null
npm install --production
chown -R %{push_user}:%{push_group} .
popd 2>/dev/null

if [ $RPM_ACTION == "upgrade" ]; then
    /etc/init.d/push-server-multi reset > /dev/null 2>&1
fi

%files
%defattr(-,%{push_user},%{push_group})
%{push_home}/*
/etc/push-server/*
/etc/init.d/push-server-multi
%if %{use_systemd}
%{_unitdir}/push-server.service
%endif
%config(noreplace) /etc/sysconfig/push-server-multi
%changelog

