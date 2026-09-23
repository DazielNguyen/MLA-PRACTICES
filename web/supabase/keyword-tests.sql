\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
do $$
declare r jsonb; result jsonb; deck jsonb; bad jsonb;
begin
  r:=jsonb_build_object('key','keyword:d1-p1-5753cbd622eb6b7e','kind','keyword','value',jsonb_build_object('id','d1-p1-5753cbd622eb6b7e','status','mastered','seenAt',10,'result',true),'stamp',10,'writer','tab-a');
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(r));
  assert result->0->'value'->>'status'='mastered','knowledge progress saved';
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(jsonb_set(jsonb_set(r,'{stamp}','9'),'{value,status}','"review"')));
  assert result->0->'value'->>'status'='mastered','stale progress cannot overwrite newer state';
  deck:=jsonb_build_object('ids',jsonb_build_array('d1-p1-5753cbd622eb6b7e','d1-p1-982ee79a0a6aa1a8'),'index',1,'mode','match','selected','a choice','revealed',true,'correct',1,'answered',1,'startedAt',10);
  result:=public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(jsonb_build_object('key','keywordDeck:tab-a','kind','keywordDeck','value',deck,'stamp',10,'writer','tab-a')));
  assert result->0->'value'->>'index'='1','deck resumes at saved index';
  foreach bad in array array[
    jsonb_set(r,'{value,id}','"unknown"'),
    jsonb_set(r,'{value,status}','"invalid"'),
    jsonb_set(r,'{value,result}','"true"'),
    jsonb_set(r,'{key}','"keyword:d1-p1-982ee79a0a6aa1a8"')
  ] loop
    begin
      perform public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(bad));
      assert false,'invalid progress accepted';
    exception when raise_exception then assert sqlerrm='Invalid keyword progress'; end;
  end loop;
  foreach bad in array array[
    jsonb_set(deck,'{ids}','["unknown"]'),
    jsonb_set(deck,'{ids}','["d1-p1-5753cbd622eb6b7e","d1-p1-5753cbd622eb6b7e"]'),
    jsonb_set(deck,'{index}','9'),
    jsonb_set(deck,'{correct}','3'),
    jsonb_set(deck,'{answered}','0'),
    jsonb_set(deck,'{mode}','"invalid"'),
    jsonb_set(deck,'{revealed}','1')
  ] loop
    begin
      perform public.ml_push_rows('11111111-1111-1111-1111-111111111111',jsonb_build_array(jsonb_build_object('key','keywordDeck:tab-b','kind','keywordDeck','value',bad,'stamp',10,'writer','tab-b')));
      assert false,'invalid deck accepted';
    exception when raise_exception then assert sqlerrm in ('Invalid keyword deck','Invalid keyword deck content'); end;
  end loop;
end $$;
set request.jwt.claim.sub='cccccccc-cccc-cccc-cccc-cccccccccccc';
do $$
begin
  assert (select count(*)=0 from public.ml_records where kind in ('keyword','keywordDeck')), 'knowledge progress remains private';
  begin
    perform public.ml_push_rows('11111111-1111-1111-1111-111111111111','[]');
    assert false,'non-member wrote keyword progress';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
