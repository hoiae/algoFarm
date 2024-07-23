package com.ssafy.algoFarm.group.service;

import com.ssafy.algoFarm.algo.user.UserRepository;
import com.ssafy.algoFarm.algo.user.entity.User;
import com.ssafy.algoFarm.group.dto.response.CreateGroupResDto;
import com.ssafy.algoFarm.group.dto.response.JoinGroupResDto;
import com.ssafy.algoFarm.group.entity.Group;
import com.ssafy.algoFarm.group.entity.Member;
import com.ssafy.algoFarm.group.repository.GroupRepository;
import com.ssafy.algoFarm.group.repository.MemberRepository;
import com.ssafy.algoFarm.mascot.entity.Mascot;
import com.ssafy.algoFarm.mascot.repository.MascotRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final MascotRepository mascotRepository;

    /**
     * 그룹을 생성한뒤 그룹 id를 반환한다.
     *
     * @param userPk user고유id
     * @param nickname 그룹에 참가하며 사용할 nickname
     * @param groupName 생성할 그룹의 이름
     * @return dto
     */
    public CreateGroupResDto createGroup(Long userPk, String nickname, String groupName) {
        //기본 캐릭터 조회
        Mascot defaultMascot = mascotRepository.findById(1L).orElseThrow();

        Group newGroup = new Group();
        //그룹을 생성한다.
        //TODO 초대코드 로직 레디스 활용해서 바꿔야함.
        String inviteCode = UUID.randomUUID().toString();
        newGroup.setCode(inviteCode);
        newGroup.setName(groupName);
        newGroup.setMascot(defaultMascot);
        groupRepository.save(newGroup);
        Long groupId = newGroup.getId();



        //해당 그룹에 생성자를 가입시킨다.
        User participant = userRepository.findById(userPk).get();
        Member member = new Member();
        member.setUser(participant);
        member.setNickname(nickname);
        member.setIsLeader(true); //그룹장 표기
        member.setGroup(newGroup);
        memberRepository.save(member);


        newGroup.countUpCurrentNum();//현재 참가인원을 증가시킨다.

        return new CreateGroupResDto(groupId,groupName,inviteCode);
    }

    /**
     * 초대코드를 통해 그룹에 가입하는 로직
     * @param code 초대코드
     * @return JoinGroupResDto(그룹id, 그룹명)
     */
    public JoinGroupResDto joinGroup( Long userPk, String nickname, String code) {
        Group group = groupRepository.findByCode(code).orElseThrow();
        return new JoinGroupResDto(group.getId(), group.getName());
    }

    /**
     * 그룹탈퇴를 위한 메서드
     * @param userPk user고유 pk
     * @param groupId 탈퇴할 그룹id
     */
    public void leaveGroup(Long userPk, Long groupId) {
        //그룹의 마지막 멤버인 경우, 그룹을 삭제한다.
        //TODO 그룹이 없는 경우 예외처리 해야함.
        Group group = groupRepository.findById(groupId).orElseThrow();
        if(group.getMembers().size() == 1){
            groupRepository.delete(group);
        }


        //그룹장의 경우 가입일이 다른 파티원에게 그룹장의 권한을 넘긴다.
        Member member = memberRepository.findById(userPk).orElseThrow();
        if(member.getIsLeader()){
            group.getMembers();
        }
        //그룹을 탈퇴한다.

    }
}
