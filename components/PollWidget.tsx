import React, { useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostPoll, votePollApi } from '../api/posts';

type Props = {
  postId: string;
  poll: PostPoll;
  onVoted?: (updatedPoll: PostPoll) => void;
};

// 2026.08.22 임재준
// 0ms 낙관적 업데이트 + DeviceEventEmitter를 통한 화면 간(목록/상세) 실시간 투표 동기화
export default function PollWidget({ postId, poll, onVoted }: Props) {
  const [currentPoll, setCurrentPoll] = useState<PostPoll>(poll);

  const pollRef = useRef<PostPoll>(poll);
  const requestQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingCountRef = useRef<number>(0);

  useEffect(() => {
    if (pendingCountRef.current === 0) {
      setCurrentPoll(poll);
      pollRef.current = poll;
    }
  }, [poll]);

  const hasVoted = currentPoll.userVotedOptionId !== null && currentPoll.userVotedOptionId !== undefined;

  const handleVote = (optionId: string | number, event: any) => {
    event.stopPropagation();
    if (currentPoll.isClosed) return;

    const activePoll = pollRef.current;
    const isCancelling = String(activePoll.userVotedOptionId) === String(optionId);
    const hadVoted = activePoll.userVotedOptionId !== null && activePoll.userVotedOptionId !== undefined;

    let nextOptions = [...activePoll.options];
    let nextTotalVotes = activePoll.totalVotes;
    let nextVotedId: string | number | null = optionId;

    if (isCancelling) {
      // 1. 투표 취소
      nextOptions = nextOptions.map((opt) =>
        String(opt.id) === String(optionId) ? { ...opt, votes: Math.max(opt.votes - 1, 0) } : opt
      );
      nextTotalVotes = Math.max(nextTotalVotes - 1, 0);
      nextVotedId = null;
    } else if (hadVoted) {
      // 2. 다른 선택지로 변경
      nextOptions = nextOptions.map((opt) => {
        if (String(opt.id) === String(optionId)) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (String(opt.id) === String(activePoll.userVotedOptionId)) {
          return { ...opt, votes: Math.max(opt.votes - 1, 0) };
        }
        return opt;
      });
    } else {
      // 3. 최초 투표
      nextOptions = nextOptions.map((opt) =>
        String(opt.id) === String(optionId) ? { ...opt, votes: opt.votes + 1 } : opt
      );
      nextTotalVotes += 1;
    }

    const optimisticPoll: PostPoll = {
      ...activePoll,
      options: nextOptions,
      totalVotes: nextTotalVotes,
      userVotedOptionId: nextVotedId,
    };

    // 0ms 즉시 화면 반영
    setCurrentPoll(optimisticPoll);
    pollRef.current = optimisticPoll;
    onVoted?.(optimisticPoll);

    // 전체 화면(목록, 상세 등)에 즉시 이벤트 전파
    DeviceEventEmitter.emit('poll:updated', {
      postId: String(postId),
      poll: optimisticPoll,
    });

    pendingCountRef.current += 1;

    requestQueueRef.current = requestQueueRef.current.then(async () => {
      try {
        const res = await votePollApi(postId, optionId);
        pendingCountRef.current = Math.max(pendingCountRef.current - 1, 0);

        if (pendingCountRef.current === 0 && res?.poll) {
          const serverPoll: PostPoll = {
            id: res.poll.id,
            question: res.poll.question,
            options: res.poll.options,
            totalVotes: res.poll.total_votes,
            userVotedOptionId: res.poll.user_voted_option_id,
            isClosed: res.poll.is_closed,
          };
          setCurrentPoll(serverPoll);
          pollRef.current = serverPoll;
          onVoted?.(serverPoll);

          // 서버 최종 수치로 다시 한 번 전역 동기화
          DeviceEventEmitter.emit('poll:updated', {
            postId: String(postId),
            poll: serverPoll,
          });
        }
      } catch (error) {
        pendingCountRef.current = Math.max(pendingCountRef.current - 1, 0);
        console.error('Vote Sync Error:', error);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="stats-chart" size={13} color="#FF6B4A" />
          <Text style={styles.badgeText}>투표</Text>
        </View>
        {currentPoll.question ? (
          <Text style={styles.question} numberOfLines={2}>
            {currentPoll.question}
          </Text>
        ) : null}
      </View>

      <View style={styles.optionList}>
        {currentPoll.options.map((option) => {
          const isSelected = String(currentPoll.userVotedOptionId) === String(option.id);
          const percentage =
            currentPoll.totalVotes > 0
              ? Math.round((option.votes / currentPoll.totalVotes) * 100)
              : 0;

          if (hasVoted) {
            return (
              <Pressable
                key={option.id}
                style={[styles.resultRow, isSelected && styles.resultRowSelected]}
                onPress={(e) => handleVote(option.id, e)}
              >
                <View
                  style={[
                    styles.progressBar,
                    isSelected && styles.progressBarSelected,
                    { width: `${percentage}%` },
                  ]}
                />

                <View style={styles.resultContent}>
                  <View style={styles.textWrap}>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FF6B4A"
                        style={styles.checkIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {option.text}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.percentageText,
                      isSelected && styles.percentageTextSelected,
                    ]}
                  >
                    {percentage}% ({option.votes}표)
                  </Text>
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={option.id}
              style={styles.voteButton}
              onPress={(e) => handleVote(option.id, e)}
            >
              <Text style={styles.voteButtonText}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.metaText}>
          총 {currentPoll.totalVotes}명 참여 {hasVoted ? '· (선택 항목 다시 누르면 취소)' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,107,74,0.12)',
  },
  badgeText: {
    color: '#FF6B4A',
    fontSize: 11,
    fontWeight: '900',
  },
  question: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  optionList: {
    gap: 8,
  },
  voteButton: {
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#303030',
  },
  voteButtonText: {
    color: '#eee',
    fontSize: 14,
    fontWeight: '700',
  },
  resultRow: {
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    backgroundColor: '#1d1d1d',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  resultRowSelected: {
    borderColor: '#FF6B4A',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9,
  },
  progressBarSelected: {
    backgroundColor: 'rgba(255,107,74,0.22)',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  checkIcon: {
    marginRight: 6,
  },
  optionText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '900',
  },
  percentageText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
  percentageTextSelected: {
    color: '#FF6B4A',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    paddingTop: 2,
  },
  metaText: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },
});